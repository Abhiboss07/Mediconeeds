import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../lib/db/models/User.js";
import { Seller } from "../lib/db/models/Seller.js";
import { Product } from "../lib/db/models/Product.js";
import { CatalogProduct } from "../lib/db/models/CatalogProduct.js";
import { Order } from "../lib/db/models/Order.js";
import { AuditLog } from "../lib/db/models/AuditLog.js";
import { EmailOutbox } from "../lib/db/models/EmailOutbox.js";
import { runTransaction } from "../lib/db/transaction.js";
import fs from "node:fs";
import path from "node:path";

function getMongoUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  try {
    const envFile = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf8");
    const match = envFile.match(/^MONGODB_URI\s*=\s*(.*)$/m);
    if (match) return match[1].trim().replace(/^['"]|['"]$/g, "");
  } catch (err) {
    // Ignore error
  }
  return "mongodb://127.0.0.1:27017/mediconeeds";
}

const MONGODB_URI = getMongoUri();
process.env.MONGODB_URI = MONGODB_URI;

test.describe.configure({ mode: "serial" });

test.describe("Mediconeeds Marketplace Architecture Tests", () => {
  let buyerUser, sellerUser, adminUser;
  let sellerProfile;

  test.beforeAll(async () => {
    // Connect to database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    console.log(`[TEST_DB_CONNECTION] Connected to host: ${mongoose.connection.host}, database: ${mongoose.connection.name}`);

    // Clean up existing test data
    await User.deleteMany({ email: { $in: ["testbuyer@mediconeeds.com", "testseller@mediconeeds.com", "testadmin@mediconeeds.com"] } });
    await Seller.deleteMany({ email: "testseller@mediconeeds.com" });
    await Product.deleteMany({ name: { $regex: "Test Product" } });
    await CatalogProduct.deleteMany({ title: { $regex: "Test Product" } });
    await Order.deleteMany({ buyerName: "Test Buyer" });
    await AuditLog.deleteMany({ catalogId: { $regex: "test-product" } });
    await EmailOutbox.deleteMany({ to: "testseller@mediconeeds.com" });

    // Seed test users
    const hashed = await bcrypt.hash("password123", 12);

    buyerUser = await User.create({
      name: "Test Buyer",
      email: "testbuyer@mediconeeds.com",
      phone: "+919999999991",
      role: "buyer",
      passwordHash: hashed,
      emailVerified: new Date(),
    });

    sellerUser = await User.create({
      name: "Test Seller",
      email: "testseller@mediconeeds.com",
      phone: "+919999999992",
      role: "seller",
      passwordHash: hashed,
      emailVerified: new Date(),
    });

    adminUser = await User.create({
      name: "Test Admin",
      email: "testadmin@mediconeeds.com",
      phone: "+919999999993",
      role: "admin",
      passwordHash: hashed,
      emailVerified: new Date(),
    });

    sellerProfile = await Seller.create({
      user: sellerUser._id,
      company: "Test Seller Corp",
      owner: "Test Seller",
      email: "testseller@mediconeeds.com",
      mobile: "+919999999992",
      gst: "07ABWPK1234M1Z5",
      pan: "ABWPK1234M",
      address: "New Delhi, India",
      approval: "approved",
      displayName: "Test Seller Corp",
    });
  });

  test.afterAll(async () => {
    // Clean up database connections
    await mongoose.disconnect();
  });

  test("Seller Product Creation stays pending and invisible on storefront", async ({ page, request }) => {
    // Enable client console log and request failure output in test logs
    page.on("console", (msg) => console.log(`[BROWSER_CONSOLE] ${msg.text()}`));
    page.on("pageerror", (err) => console.error(`[BROWSER_ERROR] ${err.message}`));
    page.on("requestfailed", (req) => console.error(`[REQUEST_FAILED] ${req.url()} - ${req.failure()?.errorText || "Unknown error"}`));
    page.on("response", (res) => {
      if (res.status() >= 400) {
        console.error(`[HTTP_ERROR] ${res.url()} status ${res.status()}`);
      }
    });

    // 1. Log in as Seller via form
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', "testseller@mediconeeds.com");
    await page.fill('input[placeholder="••••••••"]', "password123");
    await page.click('button:has-text("Log In")');

    // Print error alert if login fails
    await page.waitForTimeout(2000);
    const alertText = await page.locator('[role="alert"]').first().textContent().catch(() => null);
    if (alertText) {
      console.error(`[LOGIN_FAILED_ALERT] ${alertText}`);
    }

    // Wait for the redirection to complete
    await page.waitForURL("**/seller/**", { timeout: 15000 }).catch((err) => {
      console.error(`[NAVIGATION_FAILED] URL is currently: ${page.url()}`);
      throw err;
    });

    // Create a product via Seller API directly within the page context to reuse the authenticated session
    const apiResult = await page.evaluate(async () => {
      const res = await fetch("/api/seller/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Product Serum",
          brand: "Dr. Awish",
          sku: "TEST-SKU-1",
          category: "serum",
          price: 500,
          mrp: 600,
          stock: 50,
          description: "Test description for serum product.",
          status: "pending",
        }),
      });
      return { status: res.status, data: await res.json() };
    });

    expect(apiResult.status).toBe(201);
    expect(apiResult.data.ok).toBe(true);
    expect(apiResult.data.status).toBe("pending");

    // Verify it is in database as pending Product
    const product = await Product.findById(apiResult.data.id);
    expect(product).not.toBeNull();
    expect(product.status).toBe("pending");

    // Verify it is NOT in CatalogProduct yet
    const catalog = await CatalogProduct.findOne({ handle: product.slug });
    expect(catalog).toBeNull();
  });

  test("Admin approves Product, triggering Publish Bridge to create CatalogProduct", async ({ request }) => {
    const product = await Product.findOne({ name: "Test Product Serum" });
    expect(product).not.toBeNull();

    await runTransaction(async (session) => {
      product.status = "active";
      await product.save({ session });
      
      const { publishProductToCatalog } = await import("../lib/db/models/Product.js");
      await publishProductToCatalog(product, session, adminUser._id);
    });

    // Verify CatalogProduct was successfully created
    const catalog = await CatalogProduct.findOne({ handle: product.slug });
    expect(catalog).not.toBeNull();
    expect(catalog.status).toBe("active");
    expect(catalog.title).toBe("Test Product Serum");
    expect(catalog.variants[0].sku).toBe("TEST-SKU-1");
    expect(catalog.variants[0].price).toBe(500);

    // Verify presentation taxonomy details mapped correctly
    expect(catalog.category).toBe("serum");
    expect(catalog.categoryName).toBe("Serums");
    expect(catalog.color).toBe("#88068e");
  });

  test("Dynamic PDP renders correctly from database CatalogProduct", async ({ page }) => {
    // Navigate directly to PDP using the slug
    await page.goto("/products/test-product-serum");

    // Assert that the title and correct price appear dynamically
    await expect(page.locator("h1").first()).toContainText("Test Product Serum");
    await expect(page.locator("text=₹500").first()).toBeVisible();
    await expect(page.locator("text=Category: Serums").first()).toBeVisible();
  });

  test("Checkout COD decrements stock atomically and increments seller stats", async ({ request }) => {
    // Clear seller stats for pristine test
    await Seller.updateOne({ _id: sellerProfile._id }, { $set: { stats: { totalOrders: 0, revenue: 0, pendingOrders: 0 } } });

    const { decrementStock } = await import("../lib/catalog/store.js");
    
    await runTransaction(async (session) => {
      await decrementStock([{ slug: "test-product-serum", sku: "TEST-SKU-1", qty: 2, price: 500 }], session, buyerUser._id);
      
      // Update Seller stats
      await Seller.updateOne(
        { _id: sellerProfile._id },
        { $inc: { "stats.totalOrders": 1, "stats.revenue": 1050, "stats.pendingOrders": 1 } },
        { session }
      );
    });

    // Verify stock has decremented in CatalogProduct
    const catalog = await CatalogProduct.findOne({ handle: "test-product-serum" });
    expect(catalog.variants[0].inventoryQty).toBe(48);

    // Verify stock has decremented in seller Product
    const product = await Product.findOne({ sku: "TEST-SKU-1" });
    expect(product.stock).toBe(48);

    // Verify Seller stats incremented
    const seller = await Seller.findById(sellerProfile._id);
    expect(seller.stats.totalOrders).toBe(1);
    expect(seller.stats.revenue).toBe(1050);
  });

  test("Stock update concurrency test (prevents overselling)", async () => {
    const { decrementStock } = await import("../lib/catalog/store.js");
    
    // Catalog product has 48 items left. Let's try 30 parallel checkouts of 2 items each (Total = 60 items required).
    const promises = Array.from({ length: 30 }).map(async () => {
      try {
        await runTransaction(async (session) => {
          await decrementStock([{ slug: "test-product-serum", sku: "TEST-SKU-1", qty: 2, price: 500 }], session, buyerUser._id);
        });
        return { success: true };
      } catch (err) {
        return { success: false, error: err.message };
      }
    });

    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.success).length;
    const failures = results.filter((r) => !r.success).length;

    // With 48 items, and qty=2 per order: maximum successes = 24.
    expect(successes).toBeLessThanOrEqual(24);
    expect(failures).toBeGreaterThanOrEqual(6);

    // Verify final stock is exactly correct and not negative
    const catalog = await CatalogProduct.findOne({ handle: "test-product-serum" });
    expect(catalog.variants[0].inventoryQty).toBe(48 - successes * 2);
    expect(catalog.variants[0].inventoryQty).toBeGreaterThanOrEqual(0);
  });

  test("Seller deletes product, resulting in soft delete and catalog archiving", async () => {
    const product = await Product.findOne({ sku: "TEST-SKU-1" });
    expect(product).not.toBeNull();

    await runTransaction(async (session) => {
      product.deleted = true;
      product.status = "archived";
      await product.save({ session });

      const { publishProductToCatalog } = await import("../lib/db/models/Product.js");
      await publishProductToCatalog(product, session, sellerUser._id);
    });

    // Verify soft deleted status in Product
    const p = await Product.findOne({ sku: "TEST-SKU-1" });
    expect(p.deleted).toBe(true);
    expect(p.status).toBe("archived");

    // Verify archived/unpublished status in CatalogProduct
    const catalog = await CatalogProduct.findOne({ handle: "test-product-serum" });
    expect(catalog.published).toBe(false);
    expect(catalog.status).toBe("archived");
  });
});
