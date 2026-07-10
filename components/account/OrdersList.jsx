"use client";
import { useEffect, useState } from "react";

const fmtINR = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await (await fetch("/api/account/orders")).json();
        if (r.ok) setOrders(r.orders);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <p className="text-[14px] text-[#6b7280]">Loading your orders…</p>;

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-8 text-center">
        <div className="text-[15px] font-semibold text-[#0e1b4d]">No orders yet</div>
        <p className="text-[13px] text-[#6b7280] mt-1">When you place an order it will appear here.</p>
        <a href="/products" className="inline-block mt-4 bg-[#3056D3] text-white text-[13px] font-bold rounded-full px-5 py-2.5">Start Shopping</a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-4 flex items-center gap-4">
          <img src={o.image} alt="" className="w-16 h-16 rounded-[10px] object-contain border border-[#eef0f5]" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-[#0e1b4d] truncate">{o.title}</div>
            <div className="text-[12px] text-[#6b7280]">Order #{o.id} · Placed {o.date} · {o.items} item(s)</div>
            <span className="inline-block mt-1 text-[12px] font-semibold text-[#006f5f] bg-[rgba(0,111,95,0.08)] rounded-full px-3 py-1 capitalize">{o.status}</span>
          </div>
          <div className="text-right">
            <div className="text-[16px] font-bold text-[#0e1b4d]">{fmtINR(o.total)}</div>
            <a href={`/account/orders/${o.id}`} className="text-[12px] font-semibold text-[#3056D3]">Track / Invoice</a>
          </div>
        </div>
      ))}
    </div>
  );
}
