// ============================================================================
// Seed Orders from the demo data, tied to the demo seller and a demo buyer so
// both the seller portal (/seller/orders) and the buyer portal (/account/orders)
// show real data. Idempotent: upserts by orderNo.
//   node --env-file=.env.local scripts/seed-orders.mjs
// ============================================================================
import mongoose from "mongoose";
import crypto from "node:crypto";
import fs from "node:fs";
import { Order } from "../lib/db/models/Order.js";
import { Seller } from "../lib/db/models/Seller.js";
import { User } from "../lib/db/models/User.js";

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) { console.error("✗ MONGODB_URI not set"); process.exit(1); }

const seed = JSON.parse(fs.readFileSync(new URL("../data/seller/seed.json", import.meta.url)));
await mongoose.connect(MONGODB_URI);

const seller = await Seller.findOne({ email: seed.seller.email.toLowerCase() }) || (await Seller.findOne({ approval: "approved" }));
if (!seller) { console.error("✗ No demo seller — run seed-products.mjs first"); process.exit(1); }

// Ensure a demo buyer for the buyer-portal demo.
let buyer = await User.findOne({ email: "buyer@demo.mediconeeds.com" });
if (!buyer) {
  buyer = new User({ name: "Demo Buyer", email: "buyer@demo.mediconeeds.com", role: "buyer", emailVerified: new Date() });
  await buyer.setPassword(crypto.randomBytes(24).toString("hex"));
  await buyer.save();
}

let created = 0, updated = 0;
for (const o of seed.orders) {
  const totalQty = o.items.reduce((a, i) => a + (i.qty || 1), 0) || 1;
  const unit = Math.round(o.amount / totalQty);
  const doc = {
    orderNo: o.id, seller: seller._id, buyer: buyer._id, buyerName: o.buyer,
    items: o.items.map((i) => ({ name: i.name, qty: i.qty, price: unit })),
    amount: o.amount, status: o.status, payment: o.payment, tracking: o.tracking || "",
    placedAt: o.date ? new Date(o.date) : new Date(),
  };
  const res = await Order.updateOne({ orderNo: o.id }, { $set: doc }, { upsert: true });
  if (res.upsertedCount) created++; else updated++;
}

console.log(`✓ Seller: ${seller.company} · Buyer: ${buyer.email}`);
console.log(`✓ Orders — created: ${created}, updated: ${updated}, total: ${await Order.countDocuments()}`);
await mongoose.disconnect();
process.exit(0);
