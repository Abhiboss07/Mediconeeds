// ============================================================================
// Seed the Product collection from the demo catalog (data/seller/seed.json),
// tied to an approved demo seller. Idempotent: upserts products by SKU.
//   node --env-file=.env.local scripts/seed-products.mjs
// ============================================================================
import mongoose from "mongoose";
import crypto from "node:crypto";
import fs from "node:fs";
import { Product, publishProductToCatalog } from "../lib/db/models/Product.js";
import { Seller } from "../lib/db/models/Seller.js";
import { User } from "../lib/db/models/User.js";

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) { console.error("✗ MONGODB_URI not set"); process.exit(1); }

const seed = JSON.parse(fs.readFileSync(new URL("../data/seller/seed.json", import.meta.url)));
const s = seed.seller;

await mongoose.connect(MONGODB_URI);

// 1) Ensure the demo seller's User + Seller profile (approved).
let user = await User.findOne({ email: s.email.toLowerCase() });
if (!user) {
  user = new User({ name: s.owner, email: s.email.toLowerCase(), phone: s.mobile, role: "seller", emailVerified: new Date() });
  await user.setPassword(crypto.randomBytes(24).toString("hex"));
  await user.save();
}
let seller = await Seller.findOne({ user: user._id });
if (!seller) {
  seller = await Seller.create({
    user: user._id, company: s.company, owner: s.owner, email: s.email.toLowerCase(), mobile: s.mobile,
    gst: s.gst, pan: s.pan, cin: s.cin, address: s.address, website: s.website,
    approval: "approved", applicationRef: s.id, displayName: s.company, rating: 4.5,
  });
}

// 2) Upsert products by SKU, tied to the seller.
let created = 0, updated = 0;
for (const p of seed.products) {
  const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const doc = {
    seller: seller._id, name: p.name, slug, brand: p.brand, sku: p.sku, category: p.category,
    hsn: p.hsn, gst: p.gst, mrp: p.mrp, price: p.price, wholesale: p.wholesale, moq: p.moq, stock: p.stock,
    images: p.image ? [p.image] : [], image: p.image, status: p.status || "active",
    views: p.views || 0, sales: p.sales || 0, rating: p.rating || 0,
  };
  
  let productDoc = await Product.findOne({ sku: p.sku, seller: seller._id });
  const isNew = !productDoc;
  if (isNew) {
    productDoc = new Product({ sku: p.sku, seller: seller._id });
  }
  Object.assign(productDoc, doc);
  await productDoc.save();

  // Explicitly trigger the publish bridge for seeded active products
  await publishProductToCatalog(productDoc);

  if (isNew) created++; else updated++;
}

console.log(`✓ Seller: ${seller.company} (${seller.approval})`);
console.log(`✓ Products — created: ${created}, updated: ${updated}, total in DB: ${await Product.countDocuments()}`);
await mongoose.disconnect();
process.exit(0);
