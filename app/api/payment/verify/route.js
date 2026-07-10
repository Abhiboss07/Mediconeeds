// ============================================================================
// Verify a Razorpay payment. The client posts the ids + signature returned by
// the Razorpay widget; we recompute the HMAC and, on success, mark the order
// paid and decrement stock. A tampered/invalid signature is rejected (402).
// ============================================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import { Seller } from "@/lib/db/models/Seller";
import { currentBuyer } from "@/lib/account/current";
import { verifyRazorpaySignature } from "@/lib/services/payment";
import { notifyOrderPlaced } from "@/lib/services/order-events";
import { decrementStock } from "@/lib/catalog/store";
import { runTransaction } from "@/lib/db/transaction";

const Schema = z.object({
  orderNo: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req) {
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 422 });
  const { orderNo, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  const valid = verifyRazorpaySignature({ orderId: razorpay_order_id, paymentId: razorpay_payment_id, signature: razorpay_signature });
  if (!valid) return NextResponse.json({ ok: false, error: "Payment verification failed." }, { status: 402 });

  await dbConnect();
  
  try {
    const result = await runTransaction(async (session) => {
      // Idempotently update the order payment status to prevent double-decrementing stock on retries
      const order = await Order.findOneAndUpdate(
        { orderNo, buyer: buyer._id, razorpayOrderId: razorpay_order_id, payment: { $ne: "paid" } },
        { $set: { payment: "paid", paymentId: razorpay_payment_id } },
        { new: true, session }
      );

      if (!order) {
        // Check if it was already marked as paid in a previous retry
        const alreadyPaidOrder = await Order.findOne({ orderNo, buyer: buyer._id, payment: "paid", paymentId: razorpay_payment_id }).session(session);
        if (alreadyPaidOrder) {
          return { alreadyProcessed: true, order: alreadyPaidOrder };
        }
        return { error: "Order not found or already processed.", status: 404 };
      }

      // Decrement stock atomically (rolls back the transaction on oversold errors)
      const items = order.items.map((i) => ({ slug: i.sku ? null : i.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: i.name, sku: i.sku, qty: i.qty, price: i.price }));
      await decrementStock(items, session, buyer._id);

      // Update Seller stats (totalOrders, revenue, pendingOrders)
      const seller = order.seller ? await Seller.findById(order.seller).session(session) : null;
      if (seller) {
        await Seller.updateOne(
          { _id: seller._id },
          {
            $inc: {
              "stats.totalOrders": 1,
              "stats.revenue": order.amount,
              "stats.pendingOrders": 1
            }
          },
          { session }
        );
      }
      return { order, seller };
    });

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    if (result.alreadyProcessed) {
      return NextResponse.json({ ok: true, orderNo: result.order.orderNo });
    }

    // Trigger post-commit notifications
    await notifyOrderPlaced(result.order, result.seller, buyer);

    return NextResponse.json({ ok: true, orderNo: result.order.orderNo });
  } catch (err) {
    console.error("[PAYMENT_VERIFY] Verification transaction aborted:", err);
    return NextResponse.json({ ok: false, error: err.message || "Verification transaction error" }, { status: 500 });
  }
}
