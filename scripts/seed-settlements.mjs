// ============================================================================
// Seed Settlement records for the demo seller by grouping their non-cancelled
// Orders into weekly payout cycles, then computing commission + GST + net.
// Older cycles are "paid", the most recent is "processing", plus one synthetic
// "upcoming" cycle. Also backfills the seller's settlement bank if missing so
// the wallet screen is fully populated. Idempotent: clears the seller's
// settlements first, then re-inserts.
//   node --env-file=.env.local scripts/seed-settlements.mjs
// ============================================================================
import mongoose from "mongoose";
import { Order } from "../lib/db/models/Order.js";
import { Seller } from "../lib/db/models/Seller.js";
import { Settlement } from "../lib/db/models/Settlement.js";

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) { console.error("✗ MONGODB_URI not set"); process.exit(1); }

const COMMISSION_RATE = 8;
const GST_RATE = 18;

await mongoose.connect(MONGODB_URI);

const seller = (await Seller.findOne({ email: "seller@awishclinic.com" })) || (await Seller.findOne({ approval: "approved" }));
if (!seller) { console.error("✗ No demo seller — run seed-products.mjs first"); process.exit(1); }

// Backfill bank details if the seed didn't set them.
if (!seller.bank || !seller.bank.account) {
  seller.bank = { bankName: "HDFC Bank", account: "50100XXXXXX2291", ifsc: "HDFC0000123" };
  await seller.save();
}

const monday = (d) => {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // 0 = Monday
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
};

const orders = await Order.find({ seller: seller._id, status: { $ne: "cancelled" } }).sort({ placedAt: 1 }).lean();

// Group into weekly buckets.
const buckets = new Map();
for (const o of orders) {
  const start = monday(o.placedAt || o.createdAt || new Date());
  const key = start.toISOString().slice(0, 10);
  if (!buckets.has(key)) buckets.set(key, { start, gross: 0, count: 0 });
  const b = buckets.get(key);
  b.gross += o.amount || 0;
  b.count += 1;
}

const weeks = [...buckets.values()].sort((a, b) => a.start - b.start);

await Settlement.deleteMany({ seller: seller._id });

let seq = 3300;
const docs = [];
weeks.forEach((w, i) => {
  const commission = Math.round(w.gross * (COMMISSION_RATE / 100));
  const gstOnCommission = Math.round(commission * (GST_RATE / 100));
  const net = w.gross - commission - gstOnCommission;
  const periodEnd = new Date(w.start); periodEnd.setDate(periodEnd.getDate() + 6);
  const isLast = i === weeks.length - 1;
  const status = isLast ? "processing" : "paid";
  const no = ++seq;
  const settledOn = status === "paid" ? new Date(periodEnd.getTime() + 2 * 864e5) : null;
  docs.push({
    seller: seller._id,
    settlementNo: `STL-${no}`,
    invoiceNo: `INV-${periodEnd.getFullYear()}-${no}`,
    periodStart: w.start, periodEnd, settledOn,
    orderCount: w.count,
    gross: w.gross, commissionRate: COMMISSION_RATE, commission,
    gstRate: GST_RATE, gstOnCommission, net,
    status,
    txnRef: status === "paid" ? `HDFCN${no}${periodEnd.getFullYear()}` : "",
  });
});

// Ensure a demoable paid history even when real orders are sparse or clustered
// into a single recent week: backfill synthetic PAID cycles for earlier weeks
// so "Paid to date" and the available balance are non-zero.
const gross = (n) => { const commission = Math.round(n * (COMMISSION_RATE / 100)); const gstOnCommission = Math.round(commission * (GST_RATE / 100)); return { commission, gstOnCommission, net: n - commission - gstOnCommission }; };
let paidCount = docs.filter((d) => d.status === "paid").length;
const earliest = weeks.length ? weeks[0].start : monday(new Date());
const synthGross = [78500, 54200, 91300];
for (let k = 0; paidCount < 3 && k < synthGross.length; k++, paidCount++) {
  const start = new Date(earliest); start.setDate(start.getDate() - 7 * (k + 1));
  const periodEnd = new Date(start); periodEnd.setDate(periodEnd.getDate() + 6);
  const g = gross(synthGross[k]);
  const no = ++seq;
  docs.unshift({
    seller: seller._id,
    settlementNo: `STL-${no}`,
    invoiceNo: `INV-${periodEnd.getFullYear()}-${no}`,
    periodStart: start, periodEnd, settledOn: new Date(periodEnd.getTime() + 2 * 864e5),
    orderCount: 5 + k, gross: synthGross[k], commissionRate: COMMISSION_RATE, commission: g.commission,
    gstRate: GST_RATE, gstOnCommission: g.gstOnCommission, net: g.net,
    status: "paid", txnRef: `HDFCN${no}${periodEnd.getFullYear()}`,
  });
}

// One synthetic upcoming cycle (current week, no orders settled yet).
const upStart = monday(new Date());
const upEnd = new Date(upStart); upEnd.setDate(upEnd.getDate() + 6);
const upGross = 43450;
const upComm = Math.round(upGross * COMMISSION_RATE / 100);
const upGst = Math.round(upComm * GST_RATE / 100);
docs.push({
  seller: seller._id,
  settlementNo: `STL-${++seq}`,
  invoiceNo: `INV-${upEnd.getFullYear()}-${seq}`,
  periodStart: upStart, periodEnd: upEnd, settledOn: null,
  orderCount: 3, gross: upGross, commissionRate: COMMISSION_RATE, commission: upComm,
  gstRate: GST_RATE, gstOnCommission: upGst, net: upGross - upComm - upGst,
  status: "upcoming", txnRef: "",
});

await Settlement.insertMany(docs);

const paid = docs.filter((d) => d.status === "paid").reduce((a, d) => a + d.net, 0);
console.log(`✓ Seller: ${seller.company}`);
console.log(`✓ Settlements — ${docs.length} (paid: ${docs.filter((d) => d.status === "paid").length}, processing: 1, upcoming: 1)`);
console.log(`✓ Available (paid net, no withdrawals yet): ₹${paid.toLocaleString("en-IN")}`);
await mongoose.disconnect();
process.exit(0);
