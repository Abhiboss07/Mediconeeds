// Seller order actions: advance to the next status, cancel, or set tracking.
// The order must belong to the current seller. `id` is the orderNo.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Order, ORDER_FLOW } from "@/lib/db/models/Order";
import { currentSeller } from "@/lib/seller/current";

// Owner-scoped single-order read (parity with the products route; fixes the
// prior 405 on GET). Returns the order only if it belongs to the current seller.
export async function GET(_req, { params }) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  const { id } = await params;
  await dbConnect();
  const order = await Order.findOne({ orderNo: id, seller: seller._id }).lean();
  if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true, order: { ...order, id: String(order._id), _id: undefined } });
}

export async function POST(req, { params }) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  const { id } = await params;
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }

  await dbConnect();
  const order = await Order.findOne({ orderNo: id, seller: seller._id });
  if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

  const action = body?.action || "advance";
  if (action === "advance") {
    const next = ORDER_FLOW[order.status];
    if (!next) return NextResponse.json({ ok: false, error: "Order cannot advance further" }, { status: 400 });
    order.status = next;
    order.statusHistory.push({ status: next, at: new Date() });
  } else if (action === "cancel") {
    if (["delivered", "cancelled"].includes(order.status)) return NextResponse.json({ ok: false, error: "Cannot cancel" }, { status: 400 });
    order.status = "cancelled";
    order.statusHistory.push({ status: "cancelled", at: new Date() });
  } else if (action === "tracking") {
    order.tracking = String(body.tracking || "");
  } else {
    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  }

  await order.save();
  return NextResponse.json({ ok: true, status: order.status, tracking: order.tracking });
}
