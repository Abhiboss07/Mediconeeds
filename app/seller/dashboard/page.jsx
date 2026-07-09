"use client";
import SellerShell from "@/components/seller/SellerShell";
import { StatCard, SectionCard, Badge, LineChart } from "@/components/seller/ui";
import { useSellerStore, dashboardStats } from "@/lib/seller/store";
import { inr, inrShort, ORDER_STATUS } from "@/lib/seller/models";

const QUICK = [
  { label: "Add Product", href: "/seller/products/new", d: "M12 5v14M5 12h14" },
  { label: "Upload CSV", href: "/seller/products", d: "M12 3v12m0-12l-4 4m4-4l4 4M4 21h16" },
  { label: "Manage Inventory", href: "/seller/inventory", d: "M3 7h18v13H3zM9 12h6" },
  { label: "Orders", href: "/seller/orders", d: "M3 6h18l-1.5 13.5H4.5z" },
  { label: "Analytics", href: "/seller/analytics", d: "M4 20V10M10 20V4M16 20v-7" },
  { label: "Coupons", href: "/seller/wallet", d: "M3 9l9-6 9 6v11H3zM9 22V12h6v10" },
  { label: "Support", href: "/seller/support", d: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
];

export default function Page() {
  const s = useSellerStore();
  const st = dashboardStats(s);
  const recent = s.orders.slice(0, 5);

  return (
    <SellerShell active="/seller/dashboard" title={`Welcome back, ${s.seller.owner.split(" ")[0]}`} subtitle="Here's how your store is performing." >
      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Products" value={st.totalProducts} sub={`${st.activeListings} active`} tone="blue" icon="◱" />
        <StatCard label="Pending Approval" value={st.pendingApproval} sub="awaiting review" tone="amber" icon="◷" />
        <StatCard label="Open Orders" value={st.openOrders} sub={`${st.orders} total`} tone="indigo" icon="◫" />
        <StatCard label="Revenue (6 mo)" value={inrShort(st.revenue)} sub="+14% vs prev" tone="green" icon="₹" />
        <StatCard label="Visitors" value={st.visitors.toLocaleString("en-IN")} sub="last 30 days" tone="violet" icon="◉" />
        <StatCard label="Conversion" value={st.conversion + "%"} sub="visit → order" tone="blue" icon="↑" />
        <StatCard label="Units Sold" value={st.totalUnitsSold.toLocaleString("en-IN")} sub="all time" tone="green" icon="✓" />
        <StatCard label="Low Stock" value={st.lowStock.length} sub={`${st.outStock.length} out of stock`} tone="red" icon="!" />
      </div>

      {/* quick actions */}
      <div className="mt-5 flex flex-wrap gap-2.5">
        {QUICK.map((q) => (
          <a key={q.label} href={q.href} className="inline-flex items-center gap-2 h-[40px] px-4 rounded-full bg-white border border-[rgba(48,86,211,0.25)] text-[13px] font-semibold text-[#3056D3] hover:bg-[rgba(48,86,211,0.06)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={q.d} /></svg>
            {q.label}
          </a>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 mt-5">
        {/* revenue chart */}
        <SectionCard title="Revenue trend" action={<a href="/seller/analytics" className="text-[12px] font-semibold text-[#3056D3]">View analytics →</a>}>
          <LineChart data={s.analytics.revenueMonthly} height={200} />
        </SectionCard>

        {/* low stock */}
        <SectionCard title="Needs attention" action={<a href="/seller/inventory" className="text-[12px] font-semibold text-[#3056D3]">Inventory →</a>}>
          <div className="space-y-2.5">
            {[...st.outStock, ...st.lowStock].slice(0, 5).map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.image} alt="" className="w-9 h-9 rounded-[8px] object-contain border border-[#eef0f5] bg-white" />
                <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-[#0e1b4d] truncate">{p.name}</div><div className="text-[12px] text-[#6b7280]">SKU {p.sku}</div></div>
                <Badge tone={p.stock === 0 ? "red" : "amber"}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</Badge>
              </div>
            ))}
            {st.outStock.length + st.lowStock.length === 0 && <p className="text-[13px] text-[#6b7280]">All products well stocked. 🎉</p>}
          </div>
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-4 mt-4">
        {/* recent orders */}
        <SectionCard title="Recent orders" action={<a href="/seller/orders" className="text-[12px] font-semibold text-[#3056D3]">All orders →</a>}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Order</th><th className="pb-2 font-semibold">Buyer</th><th className="pb-2 font-semibold">Amount</th><th className="pb-2 font-semibold">Status</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5 font-semibold text-[#0e1b4d]">{o.id}</td>
                    <td className="py-2.5 text-[#374151] max-w-[160px] truncate">{o.buyer}</td>
                    <td className="py-2.5 font-semibold text-[#0e1b4d]">{inr(o.amount)}</td>
                    <td className="py-2.5"><Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* latest reviews */}
        <SectionCard title="Latest reviews">
          <div className="space-y-3">
            {s.reviews.map((r) => (
              <div key={r.id} className="border-b border-[#f5f6fa] last:border-0 pb-2.5 last:pb-0">
                <div className="flex items-center justify-between"><span className="text-[13px] font-semibold text-[#0e1b4d] truncate">{r.product}</span><span className="text-[12px] font-bold text-[#F59E0B]">{"★".repeat(r.rating)}</span></div>
                <p className="text-[12.5px] text-[#6b7280] mt-0.5">{r.text}</p>
                <p className="text-[11px] text-[#9ca3af] mt-0.5">— {r.buyer}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </SellerShell>
  );
}
