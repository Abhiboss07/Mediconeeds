"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { StatCard, SectionCard, Badge } from "@/components/seller/ui";
import { inr, inrShort } from "@/lib/seller/models";

const STATUS_TABS = [["all", "All"], ["new", "New"], ["confirmed", "Confirmed"], ["packed", "Packed"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]];
const TONE = { new: "blue", confirmed: "indigo", packed: "amber", shipped: "violet", delivered: "green", cancelled: "red" };

export default function Page() {
  const [data, setData] = useState({ orders: [], byStatus: {}, total: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");

  useEffect(() => {
    let on = true;
    setLoading(true);
    const qs = new URLSearchParams();
    if (status !== "all") qs.set("status", status);
    if (payment !== "all") qs.set("payment", payment);
    fetch("/api/admin/orders?" + qs.toString(), { cache: "no-store" })
      .then((r) => r.json())
      .then((r) => { if (on && r.ok) setData(r); })
      .finally(() => on && setLoading(false));
    return () => { on = false; };
  }, [status, payment]);

  return (
    <AdminShell active="/admin/orders" title="Orders" subtitle="Live marketplace orders">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4">
        <StatCard label="Total orders" value={data.total} tone="blue" icon="◫" />
        <StatCard label="Revenue" value={inrShort(data.revenue)} tone="green" icon="₹" />
        <StatCard label="Delivered" value={data.byStatus.delivered || 0} tone="green" icon="✓" />
        <StatCard label="Cancelled" value={data.byStatus.cancelled || 0} tone="red" icon="✕" />
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b7280]">Order status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map(([k, label]) => (
              <button
                key={k}
                onClick={() => setStatus(k)}
                aria-pressed={status === k}
                className={`inline-flex h-10 min-w-[64px] items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] ${status === k ? "bg-[#3056D3] text-white shadow-sm" : "bg-white border border-[rgba(111,115,132,0.3)] text-[#0e1b4d] hover:border-[#3056D3] hover:text-[#3056D3]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b7280]">Payment type</p>
          <div className="flex flex-wrap gap-2">
            {[["all", "All pay"], ["cod", "COD"], ["online", "Online"]].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setPayment(k)}
                aria-pressed={payment === k}
                className={`inline-flex h-10 min-w-[64px] items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-all duration-200 active:scale-[0.97] ${payment === k ? "bg-[#0e1b4d] text-white shadow-sm" : "bg-white border border-[rgba(111,115,132,0.3)] text-[#0e1b4d] hover:border-[#0e1b4d] hover:text-[#0e1b4d]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <SectionCard title={`Orders (${data.orders.length})`}>
        {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : data.orders.length === 0 ? (
          <p className="text-[13px] text-[#6b7280]">No orders match this filter.</p>
        ) : (
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[760px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Order</th><th className="pb-2 font-semibold">Buyer</th><th className="pb-2 font-semibold">Items</th><th className="pb-2 font-semibold">Amount</th><th className="pb-2 font-semibold">Payment</th><th className="pb-2 font-semibold">Status</th></tr></thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Order">{o.orderNo}</td>
                    <td className="py-2.5 text-[#374151]" data-label="Buyer">{o.buyerName}</td>
                    <td className="py-2.5 text-[#6b7280]" data-label="Items">{o.items}</td>
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Amount">{inr(o.amount)}</td>
                    <td className="py-2.5" data-label="Payment"><span className="text-[12px] font-semibold uppercase text-[#6b7280]">{o.paymentMethod || o.payment}</span></td>
                    <td className="py-2.5" data-label="Status"><Badge tone={TONE[o.status] || "gray"}>{o.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AdminShell>
  );
}
