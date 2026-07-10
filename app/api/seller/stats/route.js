// Live seller dashboard stats — computed from the seller's own Product + Order
// documents in MongoDB. Never cached.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Product } from "@/lib/db/models/Product";
import { Order } from "@/lib/db/models/Order";
import { currentSeller } from "@/lib/seller/current";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });
  await dbConnect();
  const sid = seller._id;

  const [products, orders, revAgg, statusAgg] = await Promise.all([
    Product.find({ seller: sid, deleted: { $ne: true } }).sort({ stock: 1 }).lean(),
    Order.find({ seller: sid }).sort({ createdAt: -1 }).lean(),
    Order.aggregate([
      { $match: { seller: sid, status: { $ne: "cancelled" } } },
      { $group: { _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } }, sum: { $sum: "$amount" } } },
    ]),
    Order.aggregate([{ $match: { seller: sid } }, { $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);

  const active = products.filter((p) => p.status === "active");
  const pending = products.filter((p) => p.status === "pending");
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const outStock = products.filter((p) => p.stock === 0 && p.status === "active");
  const nonCancelled = orders.filter((o) => o.status !== "cancelled");
  const openOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const revenue = nonCancelled.reduce((a, o) => a + (o.amount || 0), 0);
  const unitsSold = orders.reduce((a, o) => a + (o.items || []).reduce((x, i) => x + (i.qty || 0), 0), 0);
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const aov = nonCancelled.length ? Math.round(revenue / nonCancelled.length) : 0;

  // last 6 months revenue series
  const revMap = {};
  for (const r of revAgg) revMap[`${r._id.y}-${r._id.m}`] = r.sum;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const revenueMonthly = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    revenueMonthly.push({ label: months[d.getMonth()], val: revMap[`${d.getFullYear()}-${d.getMonth() + 1}`] || 0 });
  }

  return NextResponse.json({
    ok: true,
    sellerName: seller.owner || seller.company || "Seller",
    stats: {
      totalProducts: products.length, activeListings: active.length, pendingApproval: pending.length,
      orders: orders.length, openOrders: openOrders.length, delivered,
      revenue, unitsSold, aov, lowStock: lowStock.length, outStock: outStock.length,
    },
    statusBreakdown: Object.fromEntries(statusAgg.map((s) => [s._id, s.n])),
    revenueMonthly,
    needsAttention: [...outStock, ...lowStock].slice(0, 5).map((p) => ({ id: String(p._id), name: p.name, sku: p.sku || "—", image: p.image || "", stock: p.stock })),
    recentOrders: orders.slice(0, 5).map((o) => ({ id: String(o._id), orderNo: o.orderNo, buyer: o.buyerName || "—", amount: o.amount, status: o.status })),
  });
}
