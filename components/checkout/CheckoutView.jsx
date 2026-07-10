"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, cartSubtotal, clearCart } from "@/lib/cart/store";

const fmtINR = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const PAY = [["upi", "UPI", "GPay · PhonePe · Paytm"], ["card", "Card", "Credit / Debit"], ["netbanking", "Net Banking", "All major banks"], ["cod", "Cash on Delivery", "Pay when delivered"]];

// Module-level so inputs keep focus across keystrokes.
function Fld({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="w-full h-[42px] px-4 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3] bg-white" />
    </label>
  );
}

export default function CheckoutView() {
  const router = useRouter();
  const cart = useCart();
  const items = cart.items;
  const subtotal = cartSubtotal(cart);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  const [addr, setAddr] = useState({ name: "", phone: "", pincode: "", city: "", address: "" });
  const [payment, setPayment] = useState("upi");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setAddr((a) => ({ ...a, [k]: e.target.value }));

  const finish = (orderNo) => { clearCart(); router.push(`/order-success?order=${encodeURIComponent(orderNo)}&pay=${payment}`); };

  function loadRazorpay() {
    if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  async function payWithRazorpay(r) {
    if (!(await loadRazorpay())) { setErr("Could not load the payment gateway."); setBusy(false); return; }
    const rp = r.razorpay;
    const razorpay = new window.Razorpay({
      key: rp.keyId, order_id: rp.orderId, amount: rp.amount, currency: "INR",
      name: "Mediconeeds", description: `Order ${r.orderNo}`,
      prefill: { name: rp.name, contact: rp.phone }, theme: { color: "#3056D3" },
      handler: async (resp) => {
        const v = await (await fetch("/api/payment/verify", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderNo: r.orderNo, razorpay_order_id: resp.razorpay_order_id, razorpay_payment_id: resp.razorpay_payment_id, razorpay_signature: resp.razorpay_signature }),
        })).json();
        if (v.ok) finish(r.orderNo);
        else { setErr("Payment could not be verified. If money was deducted, contact support."); setBusy(false); }
      },
      modal: { ondismiss: () => { setErr("Payment cancelled. Your order is not confirmed."); setBusy(false); } },
    });
    razorpay.open();
  }

  async function placeOrder() {
    setErr("");
    if (!addr.name || !addr.phone || !addr.pincode || !addr.city || !addr.address) { setErr("Please fill in all delivery address fields."); return; }
    setBusy(true);
    try {
      const r = await (await fetch("/api/checkout", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ items, address: addr, payment }),
      })).json();
      if (!r.ok) { setErr(r.error || "Could not place the order."); setBusy(false); return; }
      if (r.razorpay) { await payWithRazorpay(r); return; } // opens gateway; finish on verify
      finish(r.orderNo); // COD or simulated payment
    } catch { setErr("Something went wrong. Please try again."); setBusy(false); }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-16 text-center">
        <h1 className="text-[24px] font-extrabold text-[#0e1b4d]">Your cart is empty</h1>
        <a href="/products" className="inline-block mt-5 bg-[#3056D3] text-white text-[15px] font-bold rounded-full px-6 py-3">Browse Products</a>
      </div>
    );
  }

  return (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-6 lg:py-10">
      <h1 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d] mb-6">Checkout</h1>
      {err && <div className="mb-4 px-4 py-3 rounded-[10px] bg-[#fdecec] text-[#d23f3f] text-[13px] font-semibold">{err}</div>}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-5">
            <h2 className="text-[16px] font-bold text-[#0e1b4d] mb-4">Delivery Address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Fld label="Full Name" value={addr.name} onChange={set("name")} placeholder="Your name" />
              <Fld label="Phone" value={addr.phone} onChange={set("phone")} type="tel" placeholder="+91 ..." />
              <Fld label="Pincode" value={addr.pincode} onChange={set("pincode")} placeholder="110076" />
              <Fld label="City" value={addr.city} onChange={set("city")} placeholder="New Delhi" />
            </div>
            <div className="mt-4"><Fld label="Address" value={addr.address} onChange={set("address")} placeholder="House no, street, area" /></div>
          </div>
          <div className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-5">
            <h2 className="text-[16px] font-bold text-[#0e1b4d] mb-4">Payment Method</h2>
            <div className="space-y-2">
              {PAY.map(([val, t, d]) => (
                <label key={val} className={`flex items-center gap-3 border rounded-[12px] p-3 cursor-pointer ${payment === val ? "border-[#3056D3] bg-[#f5f7ff]" : "border-[#e5e7eb]"}`}>
                  <input type="radio" name="pay" checked={payment === val} onChange={() => setPayment(val)} />
                  <div><div className="text-[14px] font-semibold text-[#0e1b4d]">{t}</div><div className="text-[12px] text-[#6b7280]">{d}</div></div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <aside className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-5 h-fit">
          <h2 className="text-[16px] font-bold text-[#0e1b4d] mb-4">Order Summary</h2>
          {items.map((i) => (
            <div key={i.id} className="flex items-center gap-3 py-2">
              <img src={i.image} alt="" className="w-10 h-10 rounded-[8px] object-contain border border-[#eef0f5]" />
              <div className="flex-1 text-[13px] text-[#0e1b4d] truncate">{i.name} <span className="text-[#6b7280]">× {i.qty}</span></div>
              <div className="text-[13px] font-semibold">{fmtINR(i.price * i.qty)}</div>
            </div>
          ))}
          <dl className="text-[14px] space-y-2 mt-3 pt-3 border-t border-[#eef0f5]">
            <div className="flex justify-between"><dt className="text-[#6b7280]">Subtotal</dt><dd className="font-semibold">{fmtINR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#6b7280]">GST (5%)</dt><dd className="font-semibold">{fmtINR(gst)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#6b7280]">Shipping</dt><dd className="font-semibold text-[#006f5f]">FREE</dd></div>
          </dl>
          <div className="flex justify-between text-[17px] font-extrabold text-[#0e1b4d] mt-4 pt-3 border-t border-[#eef0f5]"><span>Total</span><span>{fmtINR(total)}</span></div>
          <button onClick={placeOrder} disabled={busy} className="w-full mt-5 text-center bg-[#3056D3] text-white text-[15px] font-bold rounded-full py-3 disabled:opacity-60">
            {busy ? "Placing order…" : "Place Order"}
          </button>
        </aside>
      </div>
    </div>
  );
}
