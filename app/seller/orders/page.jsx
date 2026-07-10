"use client";
import { useMemo, useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { Badge } from "@/components/seller/ui";
import { useSellerStore, advanceOrder } from "@/lib/seller/store";
import { inr, ORDER_STATUS } from "@/lib/seller/models";

const TABS = [["all", "All"], ["new", "New"], ["confirmed", "Confirmed"], ["packed", "Packed"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"]];

export default function Page() {
  const s = useSellerStore();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const rows = useMemo(() => s.orders.filter((o) => {
    if (tab !== "all" && o.status !== tab) return false;
    if (q.trim() && !(o.id + " " + o.buyer).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [s.orders, tab, q]);

  const count = (k) => (k === "all" ? s.orders.length : s.orders.filter((o) => o.status === k).length);

  return (
    <SellerShell active="/seller/orders" title="Orders" subtitle={`${s.orders.length} total orders`}>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-[36px] px-3.5 rounded-full text-[13px] font-semibold ${tab === k ? "bg-[#3056D3] text-white" : "bg-white border border-[rgba(111,115,132,0.3)] text-[#0e1b4d]"}`}>
            {label} <span className={tab === k ? "opacity-80" : "text-[#9ca3af]"}>({count(k)})</span>
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-[360px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order ID or buyer…" className="w-full h-[42px] pl-9 pr-4 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3] bg-white" />
      </div>

      <div className="rounded-[16px] border border-[rgba(111,115,132,0.16)] bg-white overflow-hidden">
        <div className="overflow-x-auto mc-rtable-wrap">
          <table className="w-full text-[13px] min-w-[860px] mc-rtable">
            <thead>
              <tr className="text-[#6b7280] text-left bg-[#fafbff] border-b border-[#eef0f5]">
                <th className="p-3 font-semibold">Order ID</th><th className="p-3 font-semibold">Buyer</th><th className="p-3 font-semibold">Products</th><th className="p-3 font-semibold">Amount</th><th className="p-3 font-semibold">Payment</th><th className="p-3 font-semibold">Status</th><th className="p-3 font-semibold">Tracking</th><th className="p-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => {
                const next = ORDER_STATUS[o.status].next;
                const nextLabel = { confirmed: "Confirm", packed: "Pack", shipped: "Ship", delivered: "Mark delivered" };
                return (
                  <tr key={o.id} className="border-b border-[#f5f6fa] last:border-0 hover:bg-[#fafbff]">
                    <td className="p-3 font-semibold text-[#0e1b4d]" data-label="Order ID">{o.id}</td>
                    <td className="p-3 text-[#374151] max-w-[160px] truncate" data-label="Buyer">{o.buyer}</td>
                    <td className="p-3 text-[#6b7280] max-w-[220px] truncate" data-label="Products">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</td>
                    <td className="p-3 font-semibold text-[#0e1b4d]" data-label="Amount">{inr(o.amount)}</td>
                    <td className="p-3" data-label="Payment"><Badge tone={o.payment === "paid" ? "green" : o.payment === "cod" ? "amber" : "red"}>{o.payment.toUpperCase()}</Badge></td>
                    <td className="p-3" data-label="Status"><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></td>
                    <td className="p-3 text-[#6b7280]" data-label="Tracking">{o.tracking || "—"}</td>
                    <td className="p-3" data-label="Action">
                      <div className="flex items-center justify-end gap-1.5">
                        {next && <button onClick={() => advanceOrder(o.id)} className="h-[30px] px-3 rounded-full bg-[#3056D3] text-white text-[12px] font-bold">{nextLabel[next]}</button>}
                        <button title="Invoice" className="h-[30px] px-2.5 rounded-full border border-[rgba(111,115,132,0.35)] text-[12px] font-semibold text-[#0e1b4d]">Invoice</button>
                        {["packed", "shipped"].includes(o.status) && <button title="Print label" className="h-[30px] px-2.5 rounded-full border border-[rgba(111,115,132,0.35)] text-[12px] font-semibold text-[#0e1b4d]">Label</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={8} className="p-10 text-center text-[#6b7280]">No orders in this view.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </SellerShell>
  );
}
