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

// Helper to load MongoDB URI from .env.local
function getMongoUri() {
  const envPath = path.join(process.cwd(), ".env.local");
  const content = fs.readFileSync(envPath, "utf8");
  const match = content.match(/MONGODB_URI\s*=\s*(.+)/);
  if (!match) throw new Error("Could not find MONGODB_URI in .env.local");
  return match[1].trim().replace(/['"]/g, "");
}

const MONGODB_URI = getMongoUri();

// Helper for universal sign out
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

// Synchronous 6-digit SHA-256 OTP brute-forcer (runs in ~20-30ms)
function bruteForceOtp(targetHash) {
  for (let i = 0; i < 1000000; i++) {
    const code = String(i).padStart(6, "0");
    const hash = crypto.createHash("sha256").update(code).digest("hex");
    if (hash === targetHash) {
      return code;
    }
  }
  return null;
}

test.describe("Mediconeeds Human Simulation E2E Validation", () => {
  const timestamp = Date.now();
  const sellerEmail = `seller_${timestamp}@example.com`;
  const buyerEmail = `buyer_${timestamp}@example.com`;
  const productName = `Simulation Serum ${timestamp}`;
  const sku = `SIM-SKU-${timestamp}`;

  test.beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    console.log(`[TEST_SETUP] Connected to DB: ${mongoose.connection.name}`);
  });

  test.afterAll(async () => {
    await mongoose.disconnect();
  });

  test("Execution flow: Onboard Seller -> Approve Seller -> Set Password -> Create Product -> Approve Product -> Buyer Purchase -> Verify Seller Stats", async ({ page }) => {
    // Configure explicit 10 minutes timeout for the test worker execution
    test.setTimeout(600000);

    // Enable browser log and error handlers
    page.on("console", (msg) => {
      const txt = msg.text();
      if (msg.type() === "error") {
        console.error(`[BROWSER_ERROR] ${txt}`);
        expect(txt).not.toContain("TypeError");
        expect(txt).not.toContain("ReferenceError");
      } else {
        console.log(`[BROWSER_CONSOLE] ${txt}`);
      }
    });

    page.on("pageerror", (err) => {
      console.error(`[BROWSER_UNHANDLED_ERROR] ${err.message}`);
      throw err;
    });

    page.on("response", (res) => {
      if (res.status() >= 500) {
        console.error(`[HTTP_5XX_ERROR] ${res.url()} status ${res.status()}`);
        throw new Error(`Critical 5xx response received: ${res.url()}`);
      }
    });

    // Write a mock document for upload step
    const mockDocPath = path.join(process.cwd(), "tmp_mock_doc.txt");
    fs.writeFileSync(mockDocPath, "This is mock verification document content.");

    // Track initial DB counts
    const initUsers = await User.countDocuments();
    const initSellers = await Seller.countDocuments();

    // ==========================================
    // STAGE 1 & 2: SELLER ONBOARDING
    // ==========================================
    console.log("[FLOW] Stage 1 & 2: Launching Seller Onboarding Wizard...");
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Discover Seller route dynamically from the homepage footer
    const becomeSellerLink = page.locator('a[href="/become-seller"]').first();
    await expect(becomeSellerLink).toBeVisible();
    await becomeSellerLink.click();
    await page.waitForURL("**/become-seller");

    const startSellingLink = page.locator('a:has-text("Start Selling")').first();
    await expect(startSellingLink).toBeVisible();
    await startSellingLink.click();
    await page.waitForURL("**/seller/register");

    // Wizard Step 1: Business Details
    console.log("[FLOW] Wizard Step 1: Submitting business profile...");
    await page.fill('input[placeholder="Dr Awish Healthcare Pvt Ltd"]', "Simulation Lab");
    await page.fill('input[placeholder="Full name"]', "John Owner");
    await page.fill('input[placeholder="07ABWPK1234M1Z5"]', "07ABWPK1234M1Z5");
    await page.fill('input[placeholder="ABWPK1234M"]', "ABWPK1234M");
    await page.fill('input[placeholder="Street, city, pincode"]', "123 Simulation St, New Delhi, 110001");
    await page.click('button:has-text("Continue")');

    // Wizard Step 2: Contact
    console.log("[FLOW] Wizard Step 2: Submitting contact info...");
    await page.fill('input[placeholder="+91 …"]', "9876543210");
    await page.fill('input[placeholder="you@company.com"]', sellerEmail);
    await page.click('button:has-text("Continue")');

    // Wizard Step 3: Bank
    console.log("[FLOW] Wizard Step 3: Submitting bank info...");
    await page.fill('input[placeholder="HDFC Bank"]', "HDFC Bank");
    await page.fill('input[placeholder="Account number"]', "123456789012");
    await page.fill('input[placeholder="HDFC0000123"]', "HDFC0000123");
    await page.click('button:has-text("Continue")');

    // Wizard Step 4: Categories
    console.log("[FLOW] Wizard Step 4: Selecting categories...");
    await page.click('button:has-text("Dermatology")');
    await page.click('button:has-text("Skincare")');
    await page.click('button:has-text("Continue")');

    // Wizard Step 5: Document upload
    console.log("[FLOW] Wizard Step 5: Uploading verification files...");
    await page.locator('input[type="file"]').first().setInputFiles(mockDocPath);
    await page.locator('input[type="file"]').nth(1).setInputFiles(mockDocPath);
    await page.click('button:has-text("Continue")');

    // Wizard Step 6: Review and Submit
    console.log("[FLOW] Wizard Step 6: Reviewing application...");
    await expect(page.locator('text=Simulation Lab')).toBeVisible();
    await page.click('button:has-text("Submit application")');

    // Wait for success screen
    await page.waitForSelector("text=Application submitted!", { timeout: 15000 });
    const successRefText = await page.locator("text=Reference ID:").textContent();
    const refId = successRefText.replace("Reference ID:", "").trim();
    console.log(`[FLOW] Seller submitted successfully with Ref ID: ${refId}`);

    // Verify DB count differences
    const afterRegisterUsers = await User.countDocuments();
    const afterRegisterSellers = await Seller.countDocuments();
    expect(afterRegisterUsers).toBe(initUsers + 1);
    expect(afterRegisterSellers).toBe(initSellers + 1);

    const dbSeller = await Seller.findOne({ email: sellerEmail });
    expect(dbSeller).not.toBeNull();
    expect(dbSeller.approval).toBe("pending");

    // ==========================================
    // STAGE 3: ADMIN APPROVAL
    // ==========================================
    console.log("[FLOW] Stage 3: Admin Approving Seller...");
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', "admin@mediconeeds.com");
    await page.fill('input[placeholder="••••••••"]', "ChangeMe!2026");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/admin**");

    // Go directly to seller approvals page
    await page.goto("/admin/sellers");
    const sellerRow = page.locator("tr", { hasText: refId });
    await expect(sellerRow).toBeVisible();
    await sellerRow.locator('button:has-text("Approve")').click();

    // Verify status updates
    await expect(sellerRow.locator("text=approved")).toBeVisible({ timeout: 10000 });
    const approvedSeller = await Seller.findOne({ email: sellerEmail });
    expect(approvedSeller.approval).toBe("approved");

    // Admin Log Out
    await performSignOut(page);

    // ==========================================
    // PASSWORD RESET FOR NEW SELLER (OTP FLOW)
    // ==========================================
    console.log("[FLOW] Forgot Password OTP reset flow for Seller...");
    await page.goto("/forgot-password");
    await page.fill('input[placeholder*="you@example.com"]', sellerEmail);
    await page.click('button:has-text("Send Code")');

    // Wait for the OTP page URL redirect
    await page.waitForURL("**/reset-password**");

    // Retrieve active OTP record from DB
    await page.waitForTimeout(2000); // Wait for record insertion
    const otpRecord = await Otp.findOne({
      identifier: sellerEmail.toLowerCase(),
      purpose: "reset",
      consumedAt: null
    }).sort({ createdAt: -1 });

    expect(otpRecord).not.toBeNull();
    const otp = bruteForceOtp(otpRecord.codeHash);
    expect(otp).not.toBeNull();
    console.log(`[FLOW] Resolved OTP from code hash: ${otp}`);

    // Fill OTP digits individually into the boxes
    for (let i = 0; i < 6; i++) {
      await page.fill(`#otp-${i}`, otp[i]);
    }

    // Set new password (requires at least 8 chars, 1 uppercase, 1 lowercase, 1 digit)
    await page.fill('label:has-text("New Password") input', "Password123");
    await page.fill('label:has-text("Confirm Password") input', "Password123");
    await page.click('button:has-text("Update Password")');

    await page.waitForSelector("text=Password updated");

    // ==========================================
    // STAGE 4: SELLER UPLOADS PRODUCT
    // ==========================================
    console.log("[FLOW] Stage 4: Seller Login & Product Upload...");
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', sellerEmail);
    await page.fill('input[placeholder="••••••••"]', "Password123");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/seller/dashboard");

    // Verify dashboard persistence on page reload
    console.log("[FLOW] Testing dashboard persistence on reload...");
    await page.reload();
    await page.waitForURL("**/seller/dashboard");

    // Verify persistence on logout and login again
    console.log("[FLOW] Testing persistence on logout and login...");
    await performSignOut(page);
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', sellerEmail);
    await page.fill('input[placeholder="••••••••"]', "Password123");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/seller/dashboard");

    // Navigate to inventory/products
    await page.goto("/seller/products/new");
    await page.fill('input[placeholder="Dr Awish Vitamin C Serum"]', productName);
    await page.fill('input[placeholder="Dr Awish"]', "Simulation Lab");
    await page.fill('textarea[placeholder="Describe the product, key ingredients and usage…"]', "Dynamic simulation serum for validation tests.");
    await page.fill('input[placeholder="1799"]', "600"); // MRP
    await page.fill('input[placeholder="1199"]', "450"); // Price
    await page.fill('input[placeholder="100"]', "10"); // Stock
    await page.fill('input[placeholder="Auto-generated if blank"]', sku);
    await page.selectOption("select", "Skincare");
    await page.click('button:has-text("Submit for approval")');

    await page.waitForURL("**/seller/products");
    console.log(`[FLOW] Product created: ${productName} (${sku})`);

    // Verify DB
    const dbProduct = await Product.findOne({ sku });
    expect(dbProduct).not.toBeNull();
    expect(dbProduct.status).toBe("pending");

    // Verify it does NOT appear on storefront catalog yet
    const initialCatalog = await CatalogProduct.findOne({ handle: dbProduct.slug });
    expect(initialCatalog).toBeNull();

    // Log Out Seller
    await performSignOut(page);

    // ==========================================
    // STAGE 5: ADMIN APPROVES PRODUCT
    // ==========================================
    console.log("[FLOW] Stage 5: Admin Product Approval...");
    await page.goto("/login");
    await page.click('text=Log in with password instead');
    await page.fill('input[placeholder="you@example.com"]', "admin@mediconeeds.com");
    await page.fill('input[placeholder="••••••••"]', "ChangeMe!2026");
    await page.click('button:has-text("Log In")');
    await page.waitForURL("**/admin**");

    await page.goto("/admin/products");
    const productRow = page.locator("tr", { hasText: productName });
    await expect(productRow).toBeVisible();
    await productRow.locator('button:has-text("Approve")').click();

    // Wait for the bridge to complete
    await page.waitForTimeout(3000);
    const approvedProduct = await Product.findOne({ sku });
    expect(approvedProduct.status).toBe("active");

    const catalogProd = await CatalogProduct.findOne({ handle: approvedProduct.slug });
    expect(catalogProd).not.toBeNull();
    expect(catalogProd.status).toBe("active");

    // Admin Log Out
    await performSignOut(page);

    // ==========================================
    // STAGE 6: BUYER PURCHASE JOURNEY (OTP SIGNUP)
    // ==========================================
    console.log("[FLOW] Stage 6: Buyer Registration & Checkout...");
    await page.goto("/signup");
    await page.fill('input[placeholder="Your name"]', "Buyer Validation");
    await page.fill('input[placeholder="+91 ..."]', "9999888877");
    await page.fill('input[placeholder="you@example.com"]', buyerEmail);
    await page.click('button:has-text("Create Account")');

    // Wait for verification screen
    await page.waitForSelector("text=Verify your email", { timeout: 15000 });

    // Retrieve active OTP record from DB
    await page.waitForTimeout(2000);
    const buyerOtpRecord = await Otp.findOne({
      identifier: buyerEmail.toLowerCase(),
      purpose: "signup",
      consumedAt: null
    }).sort({ createdAt: -1 });

    expect(buyerOtpRecord).not.toBeNull();
    const buyerOtp = bruteForceOtp(buyerOtpRecord.codeHash);
    expect(buyerOtp).not.toBeNull();
    console.log(`[FLOW] Resolved Buyer OTP from code hash: ${buyerOtp}`);

    // Fill OTP digits
    for (let i = 0; i < 6; i++) {
      await page.fill(`#otp-${i}`, buyerOtp[i]);
    }

    // Verify & Create
    await page.click('button:has-text("Verify & Create Account")');
    await page.waitForURL("**/account", { timeout: 20000 });
    console.log("[FLOW] Buyer successfully registered and logged in!");

    // Search for product
    await page.goto(`/products/${approvedProduct.slug}`);
    await expect(page.locator("h1").first()).toContainText(productName);

    // Verify variants/pricing
    await expect(page.locator("text=₹450").first()).toBeVisible();

    // Add to Cart
    await page.click('button:has-text("Add to Cart")');
    await page.goto("/cart");
    await page.click('a:has-text("Proceed to Checkout")');

    // Fill shipping address on checkout
    await page.fill('input[placeholder="Your name"]', "Buyer Validation");
    await page.fill('input[placeholder="+91 ..."]', "9999888877");
    await page.fill('input[placeholder="110076"]', "110005");
    await page.fill('input[placeholder="New Delhi"]', "New Delhi");
    await page.fill('input[placeholder="House no, street, area"]', "456 Test Lane, Test Sector 5");

    // Choose COD
    await page.locator('label', { hasText: 'Cash on Delivery' }).first().click();
    await page.click('button:has-text("Place Order")');

    // Wait for success screen
    await page.waitForURL("**/order-success**", { timeout: 15000 });
    console.log("[FLOW] Order successfully completed via COD!");

    // Verify DB increments and inventory reduction
    const finalProduct = await Product.findOne({ sku });
    const finalCatalog = await CatalogProduct.findOne({ handle: approvedProduct.slug });
    expect(finalProduct.stock).toBe(9); // Initial 10 - 1
    expect(finalCatalog.variants[0].inventoryQty).toBe(9);

    // ==========================================
    // STAGE 7: SELLER STATS POST-SALE
    // ==========================================
    console.log("[FLOW] Stage 7: Seller stats checks...");
    const finalSeller = await Seller.findOne({ email: sellerEmail });
    expect(finalSeller.stats.totalOrders).toBe(1);
    expect(finalSeller.stats.revenue).toBe(473);

    // Cleanup mock uploads
    if (fs.existsSync(mockDocPath)) fs.unlinkSync(mockDocPath);
    console.log("[FLOW] All validation tests completed successfully!");
  });
});
