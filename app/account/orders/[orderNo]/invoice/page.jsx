"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "");

export default function Page() {
  const { orderNo } = useParams();
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let on = true;
    fetch(`/api/account/orders/${orderNo}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((r) => { if (!on) return; if (r.ok) setOrder(r.order); else setErr(r.error || "Order not found"); })
      .catch(() => on && setErr("Could not load this invoice."));
    return () => { on = false; };
  }, [orderNo]);

  if (err) return <div className="max-w-[720px] mx-auto p-8 text-center"><p className="text-[15px] font-semibold text-[#0e1b4d]">{err}</p><a href="/account/orders" className="text-[13px] font-bold text-[#3056D3]">← Back to my orders</a></div>;
  if (!order) return <div className="max-w-[720px] mx-auto p-8 text-[14px] text-[#6b7280]">Loading invoice…</div>;

  const a = order.address;

  return (
    <div className="min-h-screen bg-[#eef1f6] py-6 px-3 print:bg-white print:py-0">
      <div className="max-w-[760px] mx-auto mb-4 flex justify-between items-center print:hidden">
        <a href={`/account/orders/${orderNo}`} className="text-[13px] font-bold text-[#3056D3]">← Back to order</a>
        <button onClick={() => window.print()} className="h-[40px] px-5 rounded-full bg-[#3056D3] text-white text-[13px] font-bold">Print / Save as PDF</button>
      </div>

      <div className="max-w-[760px] mx-auto bg-white rounded-[8px] border border-[#e2e7f9] p-8 print:border-0 print:rounded-none">
        <div className="flex justify-between items-start border-b border-[#e2e7f9] pb-5">
          <div>
            <div className="text-[22px] font-extrabold text-[#0e1b4d]">Medico<span className="text-[#3056D3]">needs</span></div>
            <p className="text-[12px] text-[#6b7280] mt-1">Dr Awish Clinic · India</p>
          </div>
          <div className="text-right">
            <div className="text-[18px] font-extrabold text-[#0e1b4d]">TAX INVOICE</div>
            <div className="text-[12px] text-[#6b7280] mt-1">Invoice #: <b className="text-[#0e1b4d]">{order.orderNo}</b></div>
            <div className="text-[12px] text-[#6b7280]">Date: {fmtDate(order.placedAt)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-5">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#8a93a6] mb-1">Sold by</div>
            <div className="text-[13px] font-semibold text-[#0e1b4d]">{order.sellerName}</div>
            <div className="text-[12px] text-[#6b7280]">via Mediconeeds Marketplace</div>
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#8a93a6] mb-1">Billed / shipped to</div>
            <div className="text-[13px] font-semibold text-[#0e1b4d]">{a?.name || order.buyerName || "—"}</div>
            {a && <div className="text-[12px] text-[#6b7280] leading-relaxed">{[a.address, a.city, a.pincode].filter(Boolean).join(", ")}{a.phone ? ` · ${a.phone}` : ""}</div>}
          </div>
        </div>

        <table className="w-full text-[13px] border-t border-[#e2e7f9]">
          <thead><tr className="text-[#8a93a6] text-left"><th className="py-2 font-semibold">Product</th><th className="py-2 font-semibold text-center">Qty</th><th className="py-2 font-semibold text-right">Price</th><th className="py-2 font-semibold text-right">Amount</th></tr></thead>
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i} className="border-t border-[#f0f2f8]">
                <td className="py-2.5 text-[#0e1b4d]"><div className="font-semibold">{it.name}</div>{it.sku && <div className="text-[11px] text-[#8a93a6]">SKU {it.sku}</div>}</td>
                <td className="py-2.5 text-center text-[#374151]">{it.qty}</td>
                <td className="py-2.5 text-right text-[#374151]">{inr(it.price)}</td>
                <td className="py-2.5 text-right font-semibold text-[#0e1b4d]">{inr(it.qty * it.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-4">
          <div className="w-[260px] text-[13px] space-y-1">
            <div className="flex justify-between text-[#6b7280]"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
            <div className="flex justify-between text-[#6b7280]"><span>GST ({order.gstRate}%)</span><span>{inr(order.gst)}</span></div>
            <div className="flex justify-between text-[16px] font-extrabold text-[#0e1b4d] border-t border-[#e2e7f9] pt-2 mt-1"><span>Total</span><span>{inr(order.amount)}</span></div>
            <div className="text-[11px] text-[#8a93a6] pt-1">Payment: <b className="uppercase">{order.paymentMethod || order.payment}</b></div>
          </div>
        </div>

        <p className="text-[11px] text-[#8a93a6] mt-8 border-t border-[#e2e7f9] pt-4">This is a computer-generated invoice and does not require a signature. Prices are inclusive of GST. For support, contact info@awishclinic.com.</p>
      </div>
    </div>
  );
}
