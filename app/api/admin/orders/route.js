// Admin: live orders from the Order collection. Never cached.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const payment = searchParams.get("payment");
  const q = {};
  if (status && status !== "all") q.status = status;
  if (payment === "cod") q.paymentMethod = "cod";
  else if (payment === "online") q.paymentMethod = { $ne: "cod" };

  const orders = await Order.find(q).sort({ createdAt: -1 }).limit(200).lean();
  const [totalAgg, counts] = await Promise.all([
    Order.aggregate([{ $match: q }, { $group: { _id: null, sum: { $sum: "$amount" }, n: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c._id, c.n]));

  return NextResponse.json({
    ok: true,
    total: totalAgg[0]?.n || 0,
    revenue: totalAgg[0]?.sum || 0,
    byStatus,
    orders: orders.map((o) => ({
      id: String(o._id), orderNo: o.orderNo, buyerName: o.buyerName || "—",
      amount: o.amount, status: o.status, payment: o.payment, paymentMethod: o.paymentMethod,
      items: (o.items || []).length, placedAt: o.placedAt || o.createdAt,
    })),
  });
}
