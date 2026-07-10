"use client";
import { useEffect, useState } from "react";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const STEPS = [["new", "Order Placed"], ["confirmed", "Confirmed"], ["packed", "Packed"], ["shipped", "Shipped"], ["delivered", "Delivered"]];
const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

export default function OrderTracking({ orderNo }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let on = true;
    fetch(`/api/account/orders/${orderNo}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((r) => { if (!on) return; if (r.ok) setOrder(r.order); else setErr(r.error || "Order not found"); })
      .catch(() => on && setErr("Could not load this order."))
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [orderNo]);

  if (loading) return <p className="text-[14px] text-[#6b7280]">Loading order…</p>;
  if (err) return (
    <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-8 text-center">
      <div className="text-[15px] font-semibold text-[#0e1b4d]">{err}</div>
      <a href="/account/orders" className="inline-block mt-4 text-[13px] font-bold text-[#3056D3]">← Back to my orders</a>
    </div>
  );

  const cancelled = order.status === "cancelled";
  const currentIdx = STEPS.findIndex(([k]) => k === order.status);
  const histAt = (k) => order.statusHistory?.find((h) => h.status === k)?.at;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <a href="/account/orders" className="text-[13px] font-semibold text-[#3056D3]">← My orders</a>
        <a href={`/account/orders/${orderNo}/invoice`} target="_blank" rel="noreferrer" className="h-[38px] px-4 inline-flex items-center rounded-full bg-[#3056D3] text-white text-[13px] font-bold">View / print invoice</a>
      </div>

      <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-5">
        <h2 className="text-[15px] font-bold text-[#0e1b4d] mb-4">{cancelled ? "Order cancelled" : "Order tracking"}</h2>
        {cancelled ? <p className="text-[13px] text-[#d23f3f] font-semibold">This order was cancelled.</p> : (
          <ol className="relative">
            {STEPS.map(([k, label], i) => {
              const done = i <= currentIdx;
              return (
                <li key={k} className="relative flex gap-3 pb-6 last:pb-0">
                  {i < STEPS.length - 1 && <span aria-hidden className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${i < currentIdx ? "bg-[#1e7a5a]" : "bg-[#e5e7eb]"}`} />}
                  <span className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-[#1e7a5a] text-white" : "bg-[#e5e7eb] text-[#9ca3af]"}`}>
                    {done ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 13 4 4L19 7" /></svg> : <span className="w-2 h-2 rounded-full bg-current" />}
                  </span>
                  <div className="pt-0.5">
                    <div className={`text-[14px] font-semibold ${done ? "text-[#0e1b4d]" : "text-[#9ca3af]"}`}>{label}</div>
                    {histAt(k) && <div className="text-[12px] text-[#6b7280]">{fmtDate(histAt(k))}</div>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-5">
        <h2 className="text-[15px] font-bold text-[#0e1b4d] mb-3">Items</h2>
        <div className="divide-y divide-[#f0f2f8]">
          {order.items.map((it, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-[13px]">
              <div className="min-w-0"><div className="font-semibold text-[#0e1b4d] truncate">{it.name}</div>{it.sku && <div className="text-[12px] text-[#6b7280]">SKU {it.sku}</div>}</div>
              <div className="text-right shrink-0 ml-3"><div className="text-[#6b7280]">{it.qty} × {inr(it.price)}</div><div className="font-semibold text-[#0e1b4d]">{inr(it.qty * it.price)}</div></div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-[#eef0f5] space-y-1 text-[13px]">
          <div className="flex justify-between text-[#6b7280]"><span>Subtotal</span><span>{inr(order.subtotal)}</span></div>
          <div className="flex justify-between text-[#6b7280]"><span>GST ({order.gstRate}%)</span><span>{inr(order.gst)}</span></div>
          <div className="flex justify-between text-[15px] font-bold text-[#0e1b4d] pt-1"><span>Total</span><span>{inr(order.amount)}</span></div>
          <div className="text-[12px] text-[#6b7280] pt-1">Payment: <b className="text-[#0e1b4d] uppercase">{order.paymentMethod || order.payment}</b> · Placed {fmtDate(order.placedAt)}</div>
        </div>
      </div>
    </div>
  );
}
