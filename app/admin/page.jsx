import AdminShell from "@/components/admin/AdminShell";
import { StatCard, SectionCard, Badge } from "@/components/seller/ui";
import { inrShort } from "@/lib/seller/models";
import { getAdminStats } from "@/lib/admin/stats";

export const dynamic = "force-dynamic"; // live marketplace stats — never cache

export default async function Page() {
  const s = await getAdminStats();
  return (
    <AdminShell active="/admin" title="Admin Overview" subtitle="Marketplace health at a glance">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Sellers" value={s.totalSellers} sub={`${s.approvedSellers} approved`} tone="blue" icon="◉" />
        <StatCard label="Pending Sellers" value={s.pendingSellers} sub="need review" tone="amber" icon="◷" />
        <StatCard label="Live Products" value={s.catalogCount} sub={`${s.activeProducts} seller-active`} tone="indigo" icon="◱" />
        <StatCard label="Pending Products" value={s.pendingProducts} sub="need review" tone="amber" icon="◱" />
        <StatCard label="Orders" value={s.totalOrders} tone="blue" icon="◫" />
        <StatCard label="Revenue" value={inrShort(s.revenue)} sub="all orders" tone="green" icon="₹" />
        <StatCard label="Buyers" value={s.buyers} tone="violet" icon="◉" />
        <StatCard label="Low Stock" value={s.lowStock} sub="≤ 10 units" tone="red" icon="!" />
        <StatCard label="Categories" value={s.categories} tone="indigo" icon="▦" />
        <StatCard label="Brands" value={s.brands} tone="violet" icon="◆" />
        <StatCard label="Approved Products" value={s.activeProducts} tone="green" icon="✓" />
        <StatCard label="Rejected Products" value={s.rejectedProducts} tone="red" icon="✕" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-5">
        <SectionCard title="Seller applications" action={<a href="/admin/sellers" className="text-[12px] font-semibold text-[#3056D3]">Review all →</a>}>
          {s.pendingSellerDocs.length === 0 ? (
            <p className="text-[13px] text-[#6b7280]">No pending seller applications.</p>
          ) : (
            <div className="space-y-3">
              {s.pendingSellerDocs.map((x) => (
                <div key={x.id} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-[10px] bg-[#eef2ff] text-[#3056D3] flex items-center justify-center font-bold text-[13px]">{(x.company || "S")[0]}</span>
                  <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-[#0e1b4d] truncate">{x.company}</div><div className="text-[12px] text-[#6b7280] truncate">{x.categories.join(", ") || "—"}</div></div>
                  <Badge tone="amber">Pending</Badge>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        <SectionCard title="Quick actions">
          <div className="grid grid-cols-2 gap-2.5">
            <a href="/admin/sellers" className="rounded-[12px] border border-[rgba(48,86,211,0.2)] p-4 hover:bg-[rgba(48,86,211,0.04)]"><div className="text-[14px] font-bold text-[#0e1b4d]">Approve Sellers</div><div className="text-[12px] text-[#6b7280] mt-0.5">{s.pendingSellers} waiting</div></a>
            <a href="/admin/products" className="rounded-[12px] border border-[rgba(48,86,211,0.2)] p-4 hover:bg-[rgba(48,86,211,0.04)]"><div className="text-[14px] font-bold text-[#0e1b4d]">Approve Products</div><div className="text-[12px] text-[#6b7280] mt-0.5">{s.pendingProducts} waiting</div></a>
            <a href="/admin/orders" className="rounded-[12px] border border-[rgba(48,86,211,0.2)] p-4 hover:bg-[rgba(48,86,211,0.04)]"><div className="text-[14px] font-bold text-[#0e1b4d]">View Orders</div><div className="text-[12px] text-[#6b7280] mt-0.5">{s.totalOrders} total</div></a>
            <a href="/" className="rounded-[12px] border border-[rgba(48,86,211,0.2)] p-4 hover:bg-[rgba(48,86,211,0.04)]"><div className="text-[14px] font-bold text-[#0e1b4d]">View Storefront</div><div className="text-[12px] text-[#6b7280] mt-0.5">{s.catalogCount} live products</div></a>
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
