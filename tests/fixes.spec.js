// Verifies the two client-delivery fixes:
//   1. Bulk Upload — canonical category resolution (no false "Unknown category").
//   2. Analytics — readable month-axis labels (crisp HTML, not stretched SVG).
// Runs against the LOCAL Mongo the dev server uses (MONGODB_URI from env, never
// .env.local Atlas). Seeds an ephemeral seller for login.
import { test, expect } from "@playwright/test";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "node:path";
import { User } from "../lib/db/models/User.js";
import { Seller } from "../lib/db/models/Seller.js";

const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Mediconeeds";
const EMAIL = "seller@test.com";
const PW = "Seller@123";
const SHOT_DIR = process.env.SHOT_DIR || "/tmp/fixes-shots";
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(SHOT_DIR, name), ...opts });

test.use({ launchOptions: { executablePath: "/usr/bin/google-chrome-stable" } });
test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  if (!/127\.0\.0\.1|localhost/.test(URI)) throw new Error("Refusing to run against non-local Mongo: " + URI);
  if (mongoose.connection.readyState === 0) await mongoose.connect(URI);
  const passwordHash = await bcrypt.hash(PW, 12);
  const user = await User.findOneAndUpdate(
    { email: EMAIL },
    { $set: { name: "QA Seller", role: "seller", status: "active", passwordHash, emailVerified: new Date() } },
    { upsert: true, new: true }
  );
  await Seller.findOneAndUpdate(
    { email: EMAIL },
    { $set: { user: user._id, company: "QA Seller Co", owner: "QA Seller", email: EMAIL, mobile: "+919999900000", status: "approved", approval: "approved" } },
    { upsert: true }
  );
});

test.afterAll(async () => { await mongoose.disconnect(); });

async function login(page) {
  await page.goto("/login");
  await page.click("text=Log in with password instead");
  await page.fill('input[placeholder="you@example.com"]', EMAIL);
  await page.fill('input[placeholder="••••••••"]', PW);
  await page.click('button:has-text("Log In")');
  await page.waitForURL("**/seller/**", { timeout: 30000 });
}

test("Analytics month labels are crisp, readable HTML (desktop + mobile)", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await page.goto("/seller/analytics");
  await page.waitForLoadState("networkidle");

  // Labels must exist as real HTML text (not SVG <text>).
  const jan = page.locator("span", { hasText: /^Jan$/ }).first();
  await expect(jan).toBeVisible();
  const tag = await jan.evaluate((el) => el.closest("svg") ? "in-svg" : el.tagName.toLowerCase());
  expect(tag).toBe("span");

  // Readable styling: >= 11px, semibold+, dark (not the old #9ca3af light gray).
  const style = await jan.evaluate((el) => {
    const c = getComputedStyle(el);
    return { fontSize: parseFloat(c.fontSize), fontWeight: parseInt(c.fontWeight, 10), color: c.color, family: c.fontFamily };
  });
  console.log("[ANALYTICS] Jan label style:", JSON.stringify(style));
  expect(style.fontSize).toBeGreaterThanOrEqual(11);
  expect(style.fontWeight).toBeGreaterThanOrEqual(600);
  // color should be a dark-ish gray (each RGB channel < ~130), not #9ca3af(156)
  const rgb = style.color.match(/\d+/g).map(Number);
  expect(Math.max(rgb[0], rgb[1], rgb[2])).toBeLessThan(140);

  // All six months present and non-overlapping (each within its cell).
  for (const m of ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]) {
    await expect(page.locator("span", { hasText: new RegExp("^" + m + "$") }).first()).toBeVisible();
  }

  await shot(page, "analytics-desktop.png", { fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await shot(page, "analytics-mobile.png", { fullPage: true });
});

test("Bulk Upload — valid CSV shows NO 'Unknown category' and canonicalises names", async ({ page }) => {
  test.setTimeout(120000);
  await login(page);
  await page.goto("/seller/products/bulk");
  await page.waitForLoadState("networkidle");

  await page.setInputFiles('input[type="file"][accept*=".csv"]', path.join(process.cwd(), "tests/b2b_products_valid.csv"));
  await page.click('button:has-text("Validate")');
  // preview table appears
  await page.waitForSelector("table", { timeout: 60000 });
  await page.waitForTimeout(1500);

  const unknownCount = await page.locator("text=Unknown category").count();
  console.log("[BULK] 'Unknown category' occurrences on valid preview:", unknownCount);
  expect(unknownCount).toBe(0);

  // Category inputs should show canonical names (Sunscreen, not Sunscreens).
  const cats = await page.locator('td input[value]').evaluateAll(
    (els) => els.map((e) => e.value).filter((v) => /sun|clean|serum|moistur/i.test(v))
  );
  console.log("[BULK] sample category values:", JSON.stringify([...new Set(cats)].slice(0, 8)));
  const joined = cats.join("|").toLowerCase();
  expect(joined).not.toContain("sunscreens");
  expect(joined).not.toContain("cleansers");

  await shot(page, "bulk-valid-preview.png", { fullPage: true });
});
