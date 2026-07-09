// Buyer order history — the current buyer's orders, newest first.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import { currentBuyer } from "@/lib/account/current";

const FALLBACK_IMG = "/catalog/10-vitamin-c-serum.svg";

export async function GET() {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: true, orders: [] });

  await dbConnect();
  const orders = await Order.find({ buyer: buyer._id }).sort({ placedAt: -1 }).lean();
  return NextResponse.json({
    ok: true,
    orders: orders.map((o) => {
      const first = o.items[0];
      const more = o.items.length > 1 ? ` +${o.items.length - 1} more` : "";
      return {
        id: o.orderNo,
        title: (first?.name || "Order") + more,
        image: FALLBACK_IMG,
        date: o.placedAt ? new Date(o.placedAt).toISOString().slice(0, 10) : "",
        items: o.items.reduce((a, i) => a + (i.qty || 1), 0),
        status: o.status,
        total: o.amount,
      };
    }),
  });
}
