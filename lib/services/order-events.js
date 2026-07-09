// Order-related notifications, shared by checkout (COD/simulated) and payment
// verification (Razorpay). Notifies the seller of a new order and the buyer of
// their confirmation (in-app + email).
import "server-only";
import { notify } from "@/lib/services/notify";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export async function notifyOrderPlaced(order, seller, buyer) {
  if (seller?.user) {
    await notify({
      userId: seller.user, type: "order", link: "/seller/orders",
      title: `New order ${order.orderNo}`,
      body: `${order.buyerName} placed an order of ${inr(order.amount)}.`,
      email: seller.email,
    });
  }
  if (buyer?._id) {
    await notify({
      userId: buyer._id, type: "order", link: "/account/orders",
      title: `Order ${order.orderNo} confirmed`,
      body: `Thank you! Your order of ${inr(order.amount)} has been placed.`,
      email: buyer.email,
    });
  }
}
