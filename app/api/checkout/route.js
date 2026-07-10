// ============================================================================
// Checkout — turns the buyer's cart into a real Order.
//   • COD           → order placed immediately (payment = "cod"), stock decremented
//   • online + Razorpay configured → creates a Razorpay order; the client pays,
//     then /api/payment/verify confirms the signature and marks it paid
//   • online + no keys (dev/demo)  → simulated "paid" so the flow works end-to-end
// ============================================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { Order } from "@/lib/db/models/Order";
import { Seller } from "@/lib/db/models/Seller";
import { Product } from "@/lib/db/models/Product";
import { currentBuyer } from "@/lib/account/current";
import { currentSeller } from "@/lib/seller/current";
import { createRazorpayOrder, isRazorpayConfigured, razorpayKeyId } from "@/lib/services/payment";
import { notifyOrderPlaced } from "@/lib/services/order-events";
import { resolveCatalogPrices, decrementStock } from "@/lib/catalog/store";
import { runTransaction } from "@/lib/db/transaction";

const Schema = z.object({
  items: z.array(z.object({
    id: z.string().optional(), slug: z.string().optional(), name: z.string().min(1),
    price: z.coerce.number().min(0), qty: z.coerce.number().int().min(1),
    sku: z.string().optional(),
  })).min(1, "Your cart is empty"),
  address: z.object({
    name: z.string().trim().min(2, "Name required"),
    phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Valid phone required"),
    pincode: z.string().trim().min(4, "Pincode required"),
    city: z.string().trim().min(2, "City required"),
    address: z.string().trim().min(4, "Address required"),
  }),
  payment: z.enum(["upi", "card", "netbanking", "cod"]),
});

const orderNo = () => "ORD-" + Date.now().toString(36).toUpperCase().slice(-6) + Math.floor(Math.random() * 90 + 10);

export async function POST(req) {
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Please sign in to place an order." }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 422 });
  const { address, payment } = parsed.data;

  const priced = await resolveCatalogPrices(parsed.data.items);
  if (!priced.ok) return NextResponse.json({ ok: false, error: "One or more items are no longer available." }, { status: 422 });
  const items = priced.items;

  await dbConnect();
  
  try {
    const result = await runTransaction(async (session) => {
      // Find the seller ID from the product(s) being purchased (via SKU)
      let orderSellerId = null;
      if (items.length > 0) {
        const firstProduct = await Product.findOne({ sku: items[0].sku }).session(session);
        if (firstProduct && firstProduct.seller) {
          orderSellerId = firstProduct.seller;
        }
      }
      const seller = orderSellerId ? await Seller.findById(orderSellerId).session(session) : null;

      const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
      const gst = Math.round(subtotal * 0.05);
      const amount = subtotal + gst;

      const order = new Order({
        orderNo: orderNo(), seller: seller?._id, buyer: buyer._id, buyerName: address.name, address,
        items: items.map((i) => ({ name: i.name, slug: i.slug, sku: i.sku || "", qty: i.qty, price: i.price })),
        amount, status: "new", payment: "pending", paymentMethod: payment,
        placedAt: new Date(), statusHistory: [{ status: "new", at: new Date() }],
      });

      // COD: confirm immediately.
      if (payment === "cod") {
        order.payment = "cod";
        await order.save({ session });
        await decrementStock(items, session, buyer._id);
        
        // Update Seller stats (totalOrders, revenue, pendingOrders)
        if (seller?._id) {
          await Seller.updateOne(
            { _id: seller._id },
            {
              $inc: {
                "stats.totalOrders": 1,
                "stats.revenue": amount,
                "stats.pendingOrders": 1
              }
            },
            { session }
          );
        }
        return { paid: true, order, seller, amount };
      }

      // Online + Razorpay configured: create a gateway order for the client widget.
      if (isRazorpayConfigured()) {
        const rp = await createRazorpayOrder({ amount, receipt: order.orderNo });
        if (!rp.ok) {
          throw new Error("Payment gateway error. Please try again.");
        }
        order.razorpayOrderId = rp.id;
        await order.save({ session });
        return { razorpay: true, order, rp, amount };
      }

      // Online, no gateway keys (dev/demo): simulate a successful payment.
      order.payment = "paid";
      await order.save({ session });
      await decrementStock(items, session, buyer._id);
      
      // Update Seller stats (totalOrders, revenue, pendingOrders)
      if (seller?._id) {
        await Seller.updateOne(
          { _id: seller._id },
          {
            $inc: {
              "stats.totalOrders": 1,
              "stats.revenue": amount,
              "stats.pendingOrders": 1
            }
          },
          { session }
        );
      }
      return { simulated: true, order, seller, amount };
    });

    if (result.razorpay) {
      return NextResponse.json({
        ok: true,
        orderNo: result.order.orderNo,
        amount: result.amount,
        razorpay: {
          keyId: razorpayKeyId(),
          orderId: result.rp.id,
          amount: result.rp.amount,
          name: address.name,
          phone: address.phone
        }
      });
    }

    await notifyOrderPlaced(result.order, result.seller, buyer);
    return NextResponse.json({ ok: true, orderNo: result.order.orderNo, amount: result.amount, paid: true, simulated: result.simulated });

  } catch (err) {
    console.error("[CHECKOUT] Checkout transaction aborted:", err);
    return NextResponse.json({ ok: false, error: err.message || "Checkout transaction error" }, { status: 500 });
  }
}
