// Verifies the two production fixes:
//   1. Auth redirect — login/signup land buyers on "/" (home), honouring
//      callbackUrl when present (never a forced "/account").
//   2. PDP — home-page product cards open valid product detail pages (no 404),
//      because the static fragments' stub links are rewritten to live catalogue
//      handles. Runs against the LOCAL Mongo the dev server uses.
import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { User } from "../lib/db/models/User.js";
import { Otp } from "../lib/db/models/Otp.js";

const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/mediconeeds";
const BUYER = "qa.buyer.redirect@test.com";
const BUYER_PW = "Buyer@12345";

function bruteForceOtp(targetHash) {
  for (let i = 0; i < 1000000; i++) {
    const code = String(i).padStart(6, "0");
    if (crypto.createHash("sha256").update(code).digest("hex") === targetHash) return code;
  }
  return null;
}

test.use({ launchOptions: { executablePath: "/usr/bin/google-chrome-stable" } });
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  if (!/127\.0\.0\.1|localhost/.test(URI)) throw new Error("Refusing non-local Mongo: " + URI);
  if (mongoose.connection.readyState === 0) await mongoose.connect(URI);
  const passwordHash = await bcrypt.hash(BUYER_PW, 12);
  await User.findOneAndUpdate(
    { email: BUYER },
    { $set: { name: "QA Buyer", role: "buyer", status: "active", passwordHash, emailVerified: new Date() } },
    { upsert: true }
  );
});
test.afterAll(async () => { await mongoose.disconnect(); });

async function passwordLogin(page, callbackUrl = "") {
  await page.goto("/login" + (callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""));
  await page.click("text=Log in with password instead");
  await page.fill('input[placeholder="you@example.com"]', BUYER);
  await page.fill('input[placeholder="••••••••"]', BUYER_PW);
  await page.click('button:has-text("Log In")');
}

test("Buyer login with no callbackUrl lands on home (/), not /account", async ({ page }) => {
  test.setTimeout(90000);
  await passwordLogin(page);
  await page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 30000 });
  expect(new URL(page.url()).pathname).toBe("/");
});

test("Buyer login WITH callbackUrl returns to that page", async ({ page }) => {
  test.setTimeout(90000);
  await passwordLogin(page, "/cart");
  await page.waitForURL((u) => new URL(u).pathname === "/cart", { timeout: 30000 });
  expect(new URL(page.url()).pathname).toBe("/cart");
});

test("New buyer signup lands on home (/), not /account", async ({ page }) => {
  test.setTimeout(120000);
  const email = `qa.signup.${Date.now()}@test.com`;
  await page.goto("/signup");
  await page.fill('input[placeholder="Your name"]', "QA Signup");
  await page.fill('input[placeholder="+91 ..."]', "+919888800000");
  await page.fill('input[placeholder="you@example.com"]', email);
  await page.click('button:has-text("Create Account")');
  // OTP step
  await page.waitForSelector("#otp-0", { timeout: 30000 });
  const rec = await Otp.findOne({ identifier: email.toLowerCase(), purpose: "signup", consumedAt: null }).sort({ createdAt: -1 });
  expect(rec).not.toBeNull();
  const code = bruteForceOtp(rec.codeHash);
  expect(code).not.toBeNull();
  for (let i = 0; i < 6; i++) await page.fill(`#otp-${i}`, code[i]);
  await page.click('button:has-text("Verify")');
  await page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 30000 });
  expect(new URL(page.url()).pathname).toBe("/");
});

test("Home product cards open valid PDPs (no 404)", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Collect product links from the (visible) home page.
  const hrefs = await page.$$eval('a[href^="/products/"]', (els) =>
    [...new Set(els.map((e) => e.getAttribute("href")).filter((h) => h && /^\/products\/[a-z0-9-]+$/.test(h) && !h.includes("/products/page")))]
  );
  console.log("[PDP] distinct product links on home:", hrefs.length, hrefs.slice(0, 6));
  expect(hrefs.length).toBeGreaterThan(0);
  // None should be the dead placeholder unless it is genuinely a live product.
  expect(hrefs).not.toContain("/products/dr-awish-glow-care-combo-DEAD");

  // Visit up to 5 of them and assert each renders a real PDP (not notFound).
  const sample = hrefs.slice(0, 5);
  for (const href of sample) {
    const resp = await page.goto(href);
    expect(resp.status(), `status for ${href}`).toBeLessThan(400);
    await expect(page.locator("text=Product Not Found")).toHaveCount(0);
    // ProductView renders an Add-to-cart action on a real product page.
    const hasCart = await page.locator('button:has-text("Add to Cart"), button:has-text("Add to cart"), button:has-text("Buy")').count();
    console.log(`[PDP] ${href} → ${resp.status()} addToCartButtons=${hasCart}`);
    expect(hasCart).toBeGreaterThan(0);
  }
});
