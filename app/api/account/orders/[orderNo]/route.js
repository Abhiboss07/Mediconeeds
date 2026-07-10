// Buyer: a single order's full detail (tracking + invoice). Buyer-scoped.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import { Seller } from "@/lib/db/models/Seller";
import { currentBuyer } from "@/lib/account/current";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req, { params }) {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  const { orderNo } = await params;

  await dbConnect();
  const o = await Order.findOne({ orderNo, buyer: buyer._id }).lean();
  if (!o) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

  let sellerName = "Mediconeeds Marketplace";
  if (o.seller) {
    const s = await Seller.findById(o.seller).select("company owner").lean();
    if (s) sellerName = s.company || s.owner || sellerName;
  }

  const subtotal = Math.round((o.amount || 0) / 1.05);
  const gst = (o.amount || 0) - subtotal;

  return NextResponse.json({
    ok: true,
    order: {
      orderNo: o.orderNo, status: o.status, paymentMethod: o.paymentMethod || "", payment: o.payment,
      placedAt: o.placedAt || o.createdAt, buyerName: o.buyerName || "",
      address: o.address || null, sellerName,
      items: (o.items || []).map((i) => ({ name: i.name, sku: i.sku || "", qty: i.qty || 1, price: i.price || 0 })),
      subtotal, gst, gstRate: 5, amount: o.amount || 0,
      statusHistory: (o.statusHistory || []).map((h) => ({ status: h.status, at: h.at })),
    },
  });
}
