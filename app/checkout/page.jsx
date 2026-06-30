import SiteChrome from "@/components/SiteChrome";
import { Field } from "@/components/ui";
import { getAllProducts, fmtINR } from "@/lib/models";
export const metadata = { title: "Checkout" };
export default function Page(){
  const lines=getAllProducts().slice(0,3);
  const subtotal=lines.reduce((s,p)=>s+p.priceRange.minVariantPrice.amount,0);
  const gst=Math.round(subtotal*0.05), total=subtotal+gst;
  const pay=[["UPI","GPay · PhonePe · Paytm"],["Card","Credit / Debit"],["Net Banking","All major banks"],["Cash on Delivery","Pay when delivered"]];
  const content=(
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-6 lg:py-10">
      <h1 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d] mb-6">Checkout</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-5">
            <h2 className="text-[16px] font-bold text-[#0e1b4d] mb-4">Delivery Address</h2>
            <div className="grid sm:grid-cols-2 gap-4"><Field label="Full Name" placeholder="Your name"/><Field label="Phone" type="tel" placeholder="+91 ..."/><Field label="Pincode" placeholder="110076"/><Field label="City" placeholder="New Delhi"/></div>
            <div className="mt-4"><Field label="Address" placeholder="House no, street, area"/></div>
          </div>
          <div className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-5">
            <h2 className="text-[16px] font-bold text-[#0e1b4d] mb-4">Payment Method</h2>
            <div className="space-y-2">{pay.map(([t,d],i)=>(<label key={i} className="flex items-center gap-3 border border-[#e5e7eb] rounded-[12px] p-3 cursor-pointer"><input type="radio" name="pay" defaultChecked={i===0}/><div><div className="text-[14px] font-semibold text-[#0e1b4d]">{t}</div><div className="text-[12px] text-[#6b7280]">{d}</div></div></label>))}</div>
          </div>
        </div>
        <aside className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-5 h-fit">
          <h2 className="text-[16px] font-bold text-[#0e1b4d] mb-4">Order Summary</h2>
          {lines.map((p,i)=>(<div key={i} className="flex items-center gap-3 py-2"><img src={p.featuredImage.url} className="w-10 h-10 rounded-[8px] object-contain border border-[#eef0f5]"/><div className="flex-1 text-[13px] text-[#0e1b4d] truncate">{p.title}</div><div className="text-[13px] font-semibold">{p.formatted.price}</div></div>))}
          <dl className="text-[14px] space-y-2 mt-3 pt-3 border-t border-[#eef0f5]"><div className="flex justify-between"><dt className="text-[#6b7280]">Subtotal</dt><dd className="font-semibold">{fmtINR(subtotal)}</dd></div><div className="flex justify-between"><dt className="text-[#6b7280]">GST (5%)</dt><dd className="font-semibold">{fmtINR(gst)}</dd></div><div className="flex justify-between"><dt className="text-[#6b7280]">Shipping</dt><dd className="font-semibold text-[#006f5f]">FREE</dd></div></dl>
          <div className="flex justify-between text-[17px] font-extrabold text-[#0e1b4d] mt-4 pt-3 border-t border-[#eef0f5]"><span>Total</span><span>{fmtINR(total)}</span></div>
          <a href="/order-success" className="block mt-5 text-center bg-[#3056D3] text-white text-[15px] font-bold rounded-full py-3">Place Order</a>
        </aside>
      </div>
    </div>);
  return <SiteChrome content={content}/>;
}
