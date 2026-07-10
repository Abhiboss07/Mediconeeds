"use client";
import { useEffect, useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { StatCard, SectionCard, Badge, LineChart } from "@/components/seller/ui";
import { inr, inrShort, ORDER_STATUS } from "@/lib/seller/models";

const QUICK = [
  { label: "Add Product", href: "/seller/products/new", d: "M12 5v14M5 12h14" },
  { label: "Products", href: "/seller/products", d: "M12 3v12m0-12l-4 4m4-4l4 4M4 21h16" },
  { label: "Manage Inventory", href: "/seller/inventory", d: "M3 7h18v13H3zM9 12h6" },
  { label: "Orders", href: "/seller/orders", d: "M3 6h18l-1.5 13.5H4.5z" },
  { label: "Analytics", href: "/seller/analytics", d: "M4 20V10M10 20V4M16 20v-7" },
  { label: "Support", href: "/seller/support", d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
];
const EMPTY = { totalProducts: 0, activeListings: 0, pendingApproval: 0, orders: 0, openOrders: 0, delivered: 0, revenue: 0, unitsSold: 0, aov: 0, lowStock: 0, outStock: 0 };
// Safe fallback so the dashboard never dereferences null (e.g. stats 403/500,
// no seller profile, empty database). Renders an all-zero empty dashboard.
const SAFE = { ok: false, sellerName: "Seller", stats: EMPTY, statusBreakdown: {}, revenueMonthly: [], needsAttention: [], recentOrders: [] };

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    fetch("/api/seller/stats", { cache: "no-store" })
      .then((r) => r.json())
      .then((r) => { if (on) setData(r && r.ok ? r : SAFE); })
      .catch(() => { if (on) setData(SAFE); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const d = data || SAFE;
  const st = d.stats || EMPTY;
  const name = (d.sellerName || "Seller").split(" ")[0];
  const noSeller = data && data.ok === false;
  const hasRevenue = (d.revenueMonthly || []).some((m) => m.val > 0);

  return (
    <SellerShell active="/seller/dashboard" title={`Welcome back, ${name}`} subtitle="Here's how your store is performing.">
      {noSeller && !loading && (
        <div className="rounded-[12px] border border-[rgba(224,99,58,0.3)] bg-[#fdf3ef] text-[#a24a2b] text-[13px] font-medium px-4 py-2.5 mb-4">
          This account has no seller profile, so no store data is available. <a href="/seller/register" className="font-bold underline">Register as a seller →</a>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Products" value={st.totalProducts} sub={`${st.activeListings} active`} tone="blue" icon="◱" />
        <StatCard label="Pending Approval" value={st.pendingApproval} sub="awaiting review" tone="amber" icon="◷" />
        <StatCard label="Open Orders" value={st.openOrders} sub={`${st.orders} total`} tone="indigo" icon="◫" />
        <StatCard label="Revenue" value={inrShort(st.revenue)} sub="all orders" tone="green" icon="₹" />
        <StatCard label="Delivered Orders" value={st.delivered} tone="green" icon="✓" />
        <StatCard label="Avg Order Value" value={inr(st.aov)} sub="per order" tone="violet" icon="₹" />
        <StatCard label="Units Sold" value={st.unitsSold.toLocaleString("en-IN")} sub="all time" tone="blue" icon="↑" />
        <StatCard label="Low Stock" value={st.lowStock} sub={`${st.outStock} out of stock`} tone="red" icon="!" />
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {QUICK.map((q) => (
          <a key={q.label} href={q.href} className="inline-flex items-center gap-2 h-[40px] px-4 rounded-full bg-white border border-[rgba(48,86,211,0.25)] text-[13px] font-semibold text-[#3056D3] hover:bg-[rgba(48,86,211,0.06)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={q.d} /></svg>{q.label}
          </a>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 mt-5">
        <SectionCard title="Revenue trend (6 mo)" action={<a href="/seller/analytics" className="text-[12px] font-semibold text-[#3056D3]">View analytics →</a>}>
          {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : hasRevenue ? <LineChart data={d.revenueMonthly} height={200} /> : <div className="h-[200px] flex items-center justify-center text-[13px] text-[#6b7280]">No revenue in the last 6 months yet.</div>}
        </SectionCard>
        <SectionCard title="Needs attention" action={<a href="/seller/inventory" className="text-[12px] font-semibold text-[#3056D3]">Inventory →</a>}>
          {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : (d.needsAttention.length === 0 ? <p className="text-[13px] text-[#6b7280]">All products well stocked. 🎉</p> : (
            <div className="space-y-2.5">
              {d.needsAttention.map((p) => (
                <div key={p.id} className="flex items-center gap-3">
                  {p.image ? <img src={p.image} alt="" className="w-9 h-9 rounded-[8px] object-contain border border-[#eef0f5] bg-white" /> : <span className="w-9 h-9 rounded-[8px] bg-[#eef2ff]" />}
                  <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-[#0e1b4d] truncate">{p.name}</div><div className="text-[12px] text-[#6b7280]">SKU {p.sku}</div></div>
                  <Badge tone={p.stock === 0 ? "red" : "amber"}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</Badge>
                </div>
              ))}
            </div>
          ))}
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 mt-4">
        <SectionCard title="Recent orders" action={<a href="/seller/orders" className="text-[12px] font-semibold text-[#3056D3]">All orders →</a>}>
          {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : d.recentOrders.length === 0 ? <p className="text-[13px] text-[#6b7280]">No orders yet.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Order</th><th className="pb-2 font-semibold">Buyer</th><th className="pb-2 font-semibold">Amount</th><th className="pb-2 font-semibold">Status</th></tr></thead>
                <tbody>
                  {d.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-[#f5f6fa] last:border-0">
                      <td className="py-2.5 font-semibold text-[#0e1b4d]">{o.orderNo}</td>
                      <td className="py-2.5 text-[#374151] max-w-[160px] truncate">{o.buyer}</td>
                      <td className="py-2.5 font-semibold text-[#0e1b4d]">{inr(o.amount)}</td>
                      <td className="py-2.5"><Badge tone={ORDER_STATUS[o.status]?.tone || "gray"}>{ORDER_STATUS[o.status]?.label || o.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
        <SectionCard title="Order status">
          {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : (
            <div className="space-y-2">
              {Object.entries(ORDER_STATUS).map(([k, meta]) => (
                <div key={k} className="flex items-center justify-between text-[13px]">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <span className="font-bold text-[#0e1b4d]">{d.statusBreakdown[k] || 0}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </SellerShell>
  );
}
