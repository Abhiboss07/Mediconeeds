"use client";
import { useCart, setQty, removeItem, cartSubtotal, cartCount } from "@/lib/cart/store";

const fmtINR = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function CartView() {
  const cart = useCart();
  const items = cart.items;
  const subtotal = cartSubtotal(cart);
  const gst = Math.round(subtotal * 0.05);
  const total = subtotal + gst;

  if (items.length === 0) {
    return (
      <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-16 text-center">
        <h1 className="text-[24px] font-extrabold text-[#0e1b4d]">Your cart is empty</h1>
        <p className="text-[14px] text-[#6b7280] mt-2">Add products to get started.</p>
        <a href="/products" className="inline-block mt-5 bg-[#3056D3] text-white text-[15px] font-bold rounded-full px-6 py-3">Browse Products</a>
      </div>
    );
  }

  return (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-6 lg:py-10">
      <h1 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d] mb-6">Your Cart ({cartCount(cart)})</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-3">
          {items.map((l) => (
            <div key={l.id} className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-4 flex gap-4">
              <img src={l.image} alt="" className="w-20 h-20 rounded-[10px] object-contain border border-[#eef0f5]" />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[#0e1b4d] line-clamp-2">{l.name}</div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center border border-[#e5e7eb] rounded-full">
                    <button onClick={() => setQty(l.id, l.qty - 1)} className="w-8 h-8 text-[#3056D3] font-bold" aria-label="Decrease">−</button>
                    <span className="w-8 text-center text-[14px]">{l.qty}</span>
                    <button onClick={() => setQty(l.id, l.qty + 1)} className="w-8 h-8 text-[#3056D3] font-bold" aria-label="Increase">+</button>
                  </div>
                  <button onClick={() => removeItem(l.id)} className="text-[12px] text-[#cf5c2d] font-semibold">Remove</button>
                </div>
              </div>
              <div className="text-[16px] font-bold text-[#0e1b4d]">{fmtINR(l.price * l.qty)}</div>
            </div>
          ))}
          <a href="/products" className="inline-block text-[14px] font-semibold text-[#3056D3]">← Continue Shopping</a>
        </div>
        <aside className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-5 h-fit">
          <h2 className="text-[16px] font-bold text-[#0e1b4d] mb-4">Order Summary</h2>
          <dl className="text-[14px] space-y-2">
            <div className="flex justify-between"><dt className="text-[#6b7280]">Subtotal</dt><dd className="font-semibold">{fmtINR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#6b7280]">GST (5%)</dt><dd className="font-semibold">{fmtINR(gst)}</dd></div>
            <div className="flex justify-between"><dt className="text-[#6b7280]">Shipping</dt><dd className="font-semibold text-[#006f5f]">FREE</dd></div>
          </dl>
          <div className="flex justify-between text-[17px] font-extrabold text-[#0e1b4d] mt-4 pt-3 border-t border-[#eef0f5]"><span>Total</span><span>{fmtINR(total)}</span></div>
          <a href="/checkout" className="block mt-5 text-center bg-[#3056D3] text-white text-[15px] font-bold rounded-full py-3">Proceed to Checkout</a>
        </aside>
      </div>
    </div>
  );
}
