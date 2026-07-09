// ============================================================================
// Seed demo notifications for the demo seller-user and demo buyer so both
// portals show data. Idempotent: only seeds a user that has none yet.
//   node --env-file=.env.local scripts/seed-notifications.mjs
// ============================================================================
import mongoose from "mongoose";
import fs from "node:fs";
import { Notification } from "../lib/db/models/Notification.js";
import { Seller } from "../lib/db/models/Seller.js";
import { User } from "../lib/db/models/User.js";

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) { console.error("✗ MONGODB_URI not set"); process.exit(1); }

const seed = JSON.parse(fs.readFileSync(new URL("../data/seller/seed.json", import.meta.url)));
await mongoose.connect(MONGODB_URI);

const seller = await Seller.findOne({ email: seed.seller.email.toLowerCase() }) || (await Seller.findOne({ approval: "approved" }));
const buyer = await User.findOne({ email: "buyer@demo.mediconeeds.com" });

const hoursAgo = (h) => new Date(Date.now() - h * 3600 * 1000);

let made = 0;
if (seller && (await Notification.countDocuments({ user: seller.user })) === 0) {
  const docs = seed.notifications.map((n, i) => ({
    user: seller.user, type: n.type, title: n.title, body: n.body, read: n.read, createdAt: hoursAgo(2 + i * 5), updatedAt: hoursAgo(2 + i * 5),
  }));
  await Notification.insertMany(docs);
  made += docs.length;
}
if (buyer && (await Notification.countDocuments({ user: buyer._id })) === 0) {
  const docs = [
    { user: buyer._id, type: "order", title: "Your order was delivered", body: "Order #ORD-24817 has been delivered.", read: false, createdAt: hoursAgo(48), updatedAt: hoursAgo(48) },
    { user: buyer._id, type: "announcement", title: "Flat 33% off on Combos & Kits", body: "Limited-time offer across skincare combos.", read: false, createdAt: hoursAgo(96), updatedAt: hoursAgo(96) },
    { user: buyer._id, type: "announcement", title: "New Launch: Dr Awish Retinol Serum", body: "Now available on Mediconeeds.", read: true, createdAt: hoursAgo(168), updatedAt: hoursAgo(168) },
  ];
  await Notification.insertMany(docs);
  made += docs.length;
}

console.log(`✓ Notifications seeded: ${made} (seller-user + buyer). Total: ${await Notification.countDocuments()}`);
await mongoose.disconnect();
process.exit(0);
