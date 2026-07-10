// Seller order list — the current seller's orders, newest first, optional status.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import { currentSeller } from "@/lib/seller/current";

export async function GET(req) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const q = { seller: seller._id };
  const status = searchParams.get("status");
  if (status && status !== "all") q.status = status;

  const orders = await Order.find(q).sort({ placedAt: -1 }).lean();
  return NextResponse.json({
    ok: true,
    orders: orders.map((o) => ({
      id: o.orderNo, buyer: o.buyerName, items: o.items.map((i) => ({ name: i.name, qty: i.qty })),
      amount: o.amount, payment: o.payment, status: o.status, tracking: o.tracking || "",
    })),
  });
}
