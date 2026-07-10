import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

import { User } from "../lib/db/models/User.js";
import { Seller } from "../lib/db/models/Seller.js";
import { Product } from "../lib/db/models/Product.js";
import { CatalogProduct } from "../lib/db/models/CatalogProduct.js";
import { Order } from "../lib/db/models/Order.js";
import { EmailOutbox } from "../lib/db/models/EmailOutbox.js";
import { AuditLog } from "../lib/db/models/AuditLog.js";
import { Otp } from "../lib/db/models/Otp.js";
import { ExportEnquiry } from "../lib/db/models/ExportEnquiry.js";
import { Contact } from "../lib/db/models/Contact.js";

// Load MONGODB_URI
function getMongoUri() {
  const envPath = path.join(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/MONGODB_URI\s*=\s*(.+)/);
  if (!match) throw new Error("Could not find MONGODB_URI in .env.local");
  return match[1].trim().replace(/['"]/g, "");
}
const MONGODB_URI = getMongoUri();

// Screenshot helper
const screenshotDir = "/home/abhiboss/.gemini/antigravity/brain/f8a2fbc9-ac1e-4304-9043-cee113cf3a9a";
async function takeScreenshot(page, filename) {
  const fullPath = path.join(screenshotDir, filename);
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log(`[SCREENSHOT] Saved to: ${fullPath}`);
  return fullPath;
}

// Universal sign out
async function performSignOut(page) {
  console.log("[FLOW] Performing universal sign out...");
  await page.goto("/api/auth/signout");
  await page.waitForLoadState("networkidle");
  const signOutBtn = page.locator('button:has-text("Sign out")');
  if (await signOutBtn.isVisible()) {
    await signOutBtn.click();
    await page.waitForNavigation({ waitUntil: "networkidle" });
  }
}

// Test Configuration
test.describe.configure({ mode: "serial" });

test.describe("Mediconeeds Marketplace Acceptance Testing (MAT)", () => {
  const uniqueId = Date.now();
  const productSKU = `SKU-MAT-${uniqueId}`;
  const productName = `Dr Awish Barrier Repair Cream 100ml`;
  const supplierEmail = `supplier_${uniqueId}@test.com`;
  const buyerEmail = `buyer@test.com`;

  test.beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    // Clean up database of previous test runs to prevent duplicate key errors
    console.log("[TEST_SETUP] Cleaning up database records...");
    await Product.deleteMany({ sku: { $regex: /^SKU-MAT-/ } });
    await Product.deleteMany({ name: productName });
    await CatalogProduct.deleteMany({ title: productName });
    await Order.deleteMany({ buyerName: "Acceptance Buyer" });
    await ExportEnquiry.deleteMany({ email: "exporter@test.com" });
    await Contact.deleteMany({ email: "contact@test.com" });
    await Seller.deleteMany({ email: { $regex: /^supplier_/ } });
    await User.deleteMany({ email: { $regex: /^supplier_/ } });
    
    // Reset stats for the static seller test account
    await Seller.updateOne(
      { email: "seller@test.com" },
      { $set: { "stats.totalOrders": 0, "stats.revenue": 0, "stats.pendingOrders": 0 } }
    );
    console.log("[TEST_SETUP] Database clean and stats reset complete.");
  });

  test.afterAll(async () => {
    await mongoose.disconnect();
  });

  // ====================================================
  // TEST 1: SELLER → ADMIN → BUYER COMPLETE FLOW
  // ====================================================
  test("Test 1: Seller Onboarding, Listing, Approval, and Buyer Purchase Flow", async ({ page }) => {
    test.setTimeout(600000);

    // Setup console error triggers
    page.on("pageerror", (err) => {
      console.error(`[BROWSER_ERROR] ${err.message}`);
      throw err;
    });

    // Step 1: Login as Seller
    console.log("[TEST 1] Step 1: Logging in as Seller...");
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', "seller@test.com");
    await page.fill('input[placeholder="••••••••"]', "Seller@123");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/seller/dashboard");
    await takeScreenshot(page, "mat_test1_seller_login.png");

    // Step 2: Create a completely NEW product
    console.log("[TEST 1] Step 2: Creating a new product listing...");
    await page.goto("/seller/products/new");
    await page.fill('input[placeholder="Dr Awish Vitamin C Serum"]', productName);
    await page.fill('input[placeholder="Dr Awish"]', "Dr Awish");
    await page.selectOption("select", "Skincare");
    await page.fill('textarea[placeholder="Describe the product, key ingredients and usage…"]', "Barrier repair formulation featuring dermatologist ingredients.");
    await page.fill('input[placeholder="18"]', "18"); // GST
    await page.fill('input[placeholder="1799"]', "899"); // MRP
    await page.fill('input[placeholder="1199"]', "699"); // Price
    await page.fill('input[placeholder="5"]', "1"); // MOQ
    await page.fill('input[placeholder="100"]', "50"); // Stock
    await page.fill('input[placeholder="Auto-generated if blank"]', productSKU);
    await page.click('button:has-text("Submit for approval")');

    // Wait explicitly for the products index route pathname to avoid matching "/new"
    await page.waitForURL((url) => url.pathname === "/seller/products", { timeout: 20000 });
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "mat_test1_seller_pending.png");

    // Verify DB state
    const createdProduct = await Product.findOne({ sku: productSKU });
    expect(createdProduct).not.toBeNull();
    expect(createdProduct.status).toBe("pending");

    // Step 3: Admin approves the product
    await performSignOut(page);
    console.log("[TEST 1] Step 3: Admin Approving Product...");
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', "admin@test.com");
    await page.fill('input[placeholder="••••••••"]', "Admin@123");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/admin**");

    await page.goto("/admin/products");
    const productRow = page.locator("tr", { hasText: productName });
    await expect(productRow).toBeVisible();
    await productRow.locator('button:has-text("Approve")').click();

    // Verify bridge synchronisation
    await page.waitForTimeout(3000);
    const activeProd = await Product.findOne({ sku: productSKU });
    expect(activeProd.status).toBe("active");

    const catalogProd = await CatalogProduct.findOne({ handle: activeProd.slug });
    expect(catalogProd).not.toBeNull();
    expect(catalogProd.status).toBe("active");

    await takeScreenshot(page, "mat_test1_admin_approved.png");

    // Step 4: Buyer logs in, searches, and inspects PDP
    await performSignOut(page);
    console.log("[TEST 1] Step 4: Buyer inspecting PDP...");
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', "buyer@test.com");
    await page.fill('input[placeholder="••••••••"]', "Buyer@123");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/account");

    // Go directly to PDP
    await page.goto(`/products/${activeProd.slug}`);
    await expect(page.locator("h1").first()).toContainText(productName);
    await expect(page.locator("text=₹699").first()).toBeVisible();
    await expect(page.locator("text=Dr Awish").first()).toBeVisible();
    await expect(page.locator("text=Skincare").first()).toBeVisible();
    await expect(page.locator("text=50 available").first()).toBeVisible();
    await takeScreenshot(page, "mat_test1_buyer_pdp.png");

    // Step 5: Complete checkout COD
    console.log("[TEST 1] Step 5: Completing COD checkout...");
    await page.click('button:has-text("Add to Cart")');
    await page.goto("/cart");
    await page.click('a:has-text("Proceed to Checkout")');

    // Fill checkout form
    await page.fill('input[placeholder="Your name"]', "Acceptance Buyer");
    await page.fill('input[placeholder="+91 ..."]', "9999888877");
    await page.fill('input[placeholder="110076"]', "110005");
    await page.fill('input[placeholder="New Delhi"]', "New Delhi");
    await page.fill('input[placeholder="House no, street, area"]', "456 Test Lane, Test Sector 5");

    await page.locator('label', { hasText: 'Cash on Delivery' }).first().click();
    await page.click('button:has-text("Place Order")');

    // Wait for success screen
    await page.waitForURL("**/order-success**", { timeout: 25000 });
    await takeScreenshot(page, "mat_test1_order_success.png");

    // Verify stock and stats decrease
    const finalProduct = await Product.findOne({ sku: productSKU });
    expect(finalProduct.stock).toBe(49); // 50 - 1

    const finalCatalog = await CatalogProduct.findOne({ handle: activeProd.slug });
    expect(finalCatalog.variants[0].inventoryQty).toBe(49);

    // Step 6: Seller Dashboard check
    await performSignOut(page);
    console.log("[TEST 1] Step 6: Checking Seller dashboard stats...");
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', "seller@test.com");
    await page.fill('input[placeholder="••••••••"]', "Seller@123");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/seller/dashboard");

    // Verify statistics updated (Selling price: 699 + 5% GST of 35 = 734 total order revenue)
    await expect(page.locator('text=Revenue').locator('xpath=../..').locator('text=₹734')).toBeVisible();
    await takeScreenshot(page, "mat_test1_seller_dashboard.png");

    // Step 7: Admin Dashboard check
    await performSignOut(page);
    console.log("[TEST 1] Step 7: Checking Admin dashboard stats...");
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', "admin@test.com");
    await page.fill('input[placeholder="••••••••"]', "Admin@123");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/admin**");
    await takeScreenshot(page, "mat_test1_admin_dashboard.png");
  });

  // ====================================================
  // TEST 2: EXPORT PAGE
  // ====================================================
  test("Test 2: Export Enquiry Form Submission", async ({ page }) => {
    console.log("[TEST 2] Submitting export enquiry...");
    await page.goto("/export");
    await page.fill('input[name="name"]', "Acceptance Exporter");
    await page.fill('input[name="email"]', "exporter@test.com");
    await page.fill('input[name="phone"]', "+91 9999888877");
    await page.fill('input[name="company"]', "Acceptance Global Trade");
    await page.selectOption('select[name="country"]', "United Arab Emirates");
    await page.fill('input[name="quantity"]', "1000 units");
    await page.fill('input[name="products"]', productName);
    await page.fill('textarea[name="message"]', "We want to import this to Dubai pharmacy chains.");
    await page.click('button:has-text("Send export enquiry")');

    // Wait for success screen
    await page.waitForSelector("text=Enquiry received", { timeout: 15000 });
    await takeScreenshot(page, "mat_test2_export_success.png");

    // Verify DB insertion
    const enquiry = await ExportEnquiry.findOne({ email: "exporter@test.com" });
    expect(enquiry).not.toBeNull();
    expect(enquiry.company).toBe("Acceptance Global Trade");
  });

  // ====================================================
  // TEST 3: BECOME SUPPLIER PAGE
  // ====================================================
  test("Test 3: Supplier Onboarding / Seller Registration Flow", async ({ page }) => {
    console.log("[TEST 3] Initiating become supplier flow...");
    await page.goto("/become-supplier");
    
    // Redirect check
    await page.waitForURL("**/become-seller");
    
    const startSellingLink = page.locator('a:has-text("Start Selling")').first();
    await startSellingLink.click();
    await page.waitForURL("**/seller/register");

    // Onboarding steps
    const mockDocPath = path.join(process.cwd(), "tmp_mock_doc.txt");
    fs.writeFileSync(mockDocPath, "Mock supplier document");

    console.log("[TEST 3] Step 1: Business details");
    await page.fill('input[placeholder="Dr Awish Healthcare Pvt Ltd"]', "Supplier Lab");
    await page.fill('input[placeholder="Full name"]', "Supplier Owner");
    await page.fill('input[placeholder="07ABWPK1234M1Z5"]', "07ABWPK1234M1Z5");
    await page.fill('input[placeholder="ABWPK1234M"]', "ABWPK1234M");
    await page.fill('input[placeholder="Street, city, pincode"]', "123 Supplier St, New Delhi, 110001");
    await page.click('button:has-text("Continue")');

    console.log("[TEST 3] Step 2: Contact");
    await page.fill('input[placeholder="+91 …"]', "9876543210");
    await page.fill('input[placeholder="you@company.com"]', supplierEmail);
    await page.click('button:has-text("Continue")');

    console.log("[TEST 3] Step 3: Bank");
    await page.fill('input[placeholder="HDFC Bank"]', "ICICI Bank");
    await page.fill('input[placeholder="Account number"]', "987654321012");
    await page.fill('input[placeholder="HDFC0000123"]', "ICIC0000123");
    await page.click('button:has-text("Continue")');

    console.log("[TEST 3] Step 4: Categories");
    await page.click('button:has-text("Skincare")');
    await page.click('button:has-text("Continue")');

    console.log("[TEST 3] Step 5: Documents");
    await page.locator('input[type="file"]').first().setInputFiles(mockDocPath);
    await page.locator('input[type="file"]').nth(1).setInputFiles(mockDocPath);
    await page.click('button:has-text("Continue")');

    console.log("[TEST 3] Step 6: Review");
    await page.click('button:has-text("Submit application")');
    
    await page.waitForSelector("text=Application submitted!", { timeout: 15000 });
    await takeScreenshot(page, "mat_test3_supplier_success.png");

    // Verify DB insert
    const supplierUser = await User.findOne({ email: supplierEmail });
    expect(supplierUser).not.toBeNull();
    const supplierProfile = await Seller.findOne({ user: supplierUser._id });
    expect(supplierProfile).not.toBeNull();
    expect(supplierProfile.company).toBe("Supplier Lab");

    if (fs.existsSync(mockDocPath)) fs.unlinkSync(mockDocPath);
  });

  // ====================================================
  // TEST 4: CONTACT PAGE
  // ====================================================
  test("Test 4: Contact Form Submission", async ({ page }) => {
    console.log("[TEST 4] Submitting contact form...");
    await page.goto("/contact");
    await page.fill('input[placeholder="Your name"]', "Acceptance Contact");
    await page.fill('input[placeholder="you@example.com"]', "contact@test.com");
    await page.fill('input[placeholder="+91 ..."]', "9999888877");
    await page.fill('textarea[placeholder="How can we help?"]', "Need assistance with wholesale pricing.");
    await page.click('button:has-text("Send Message")');

    // Wait for success status
    await page.waitForSelector("text=Message sent successfully!", { timeout: 15000 });
    await takeScreenshot(page, "mat_test4_contact_success.png");

    // Verify DB insert
    const msg = await Contact.findOne({ email: "contact@test.com" });
    expect(msg).not.toBeNull();
    expect(msg.message).toBe("Need assistance with wholesale pricing.");
  });

  // ====================================================
  // TEST 5 & 6: SEARCH & CATEGORY
  // ====================================================
  test("Test 5 & 6: Product Search and Category PLP Filters", async ({ page }) => {
    console.log("[TEST 5 & 6] Checking search and filters...");
    
    // Search "Barrier"
    await page.goto("/products");
    await page.click('button:has-text("Search for")');
    await page.fill('input[placeholder="Search serums, sunscreen, ingredients…"]', "Barrier");
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "mat_test5_search_results.png");

    // Filter by category "Skincare"
    await page.goto("/shop");
    await page.locator('label:has-text("Skincare")').first().click();
    await page.waitForTimeout(2000);
    await takeScreenshot(page, "mat_test6_category_filter.png");
  });

  // ====================================================
  // TEST 7: PDP ELEMENTS VERIFICATION
  // ====================================================
  test("Test 7: PDP Layout Elements Review", async ({ page }) => {
    console.log("[TEST 7] Reviewing PDP Layout elements...");
    const activeProd = await Product.findOne({ name: productName });
    await page.goto(`/products/${activeProd.slug}`);
    
    // Core PDP selectors
    await expect(page.locator("h1").first()).toContainText(productName);
    await expect(page.locator("text=₹699").first()).toBeVisible();
    await expect(page.locator("text=₹899").first()).toBeVisible(); // MRP
    await expect(page.locator("text=Specification").first()).toBeVisible();
    await expect(page.locator("text=Delivery").first()).toBeVisible();
    await expect(page.locator("text=Similar Products").first()).toBeVisible();

    await takeScreenshot(page, "mat_test7_pdp_elements.png");
  });

  // ====================================================
  // TEST 8 & 9: ORDER HISTORY & INVENTORY SYNC
  // ====================================================
  test("Test 8 & 9: Order History & Inventory Decrease Verification", async ({ page }) => {
    console.log("[TEST 8 & 9] Verifying order histories and inventory count...");
    
    // Log back in as Buyer
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', "buyer@test.com");
    await page.fill('input[placeholder="••••••••"]', "Buyer@123");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/account");

    // 1. Buyer order history
    await page.goto("/account/orders");
    await expect(page.locator("text=ORD-").first()).toBeVisible();
    await takeScreenshot(page, "mat_test8_order_history.png");

    // 2. Database validation of stock decrement
    const prod = await Product.findOne({ sku: productSKU });
    expect(prod.stock).toBe(49);
    console.log("[TEST 9] Stock verified at: 49");
  });
});
