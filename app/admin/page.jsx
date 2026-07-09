"use client";
import AdminShell from "@/components/admin/AdminShell";
import { StatCard, SectionCard, Badge } from "@/components/seller/ui";
import { inrShort } from "@/lib/seller/models";
import admin from "@/data/seller/admin.json";

export default function Page() {
  const p = admin.platform;
  return (
    <AdminShell active="/admin" title="Admin Overview" subtitle="Marketplace health at a glance">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Total Sellers" value={p.totalSellers} tone="blue" icon="◉" />
        <StatCard label="Pending Sellers" value={p.pendingSellers} sub="need review" tone="amber" icon="◷" />
        <StatCard label="Pending Products" value={p.pendingProducts} sub="need review" tone="amber" icon="◱" />
        <StatCard label="Platform GMV" value={inrShort(p.gmv)} tone="green" icon="₹" />
        <StatCard label="Categories" value={p.categories} tone="indigo" icon="▦" />
        <StatCard label="Brands" value={p.brands} tone="violet" icon="◆" />
        <StatCard label="Default Commission" value={p.commissionDefault + "%"} tone="blue" icon="%" />
        <StatCard label="Active regions" value="PAN India" tone="green" icon="⚑" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-5">
        <SectionCard title="Seller applications" action={<a href="/admin/sellers" className="text-[12px] font-semibold text-[#3056D3]">Review all →</a>}>
          <div className="space-y-3">
            {admin.pendingSellers.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-[10px] bg-[#eef2ff] text-[#3056D3] flex items-center justify-center font-bold text-[13px]">{s.company[0]}</span>
                <div className="min-w-0 flex-1"><div className="text-[13px] font-semibold text-[#0e1b4d] truncate">{s.company}</div><div className="text-[12px] text-[#6b7280]">{s.categories.join(", ")}</div></div>
                <Badge tone="amber">Pending</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Quick actions">
          <div className="grid grid-cols-2 gap-2.5">
            <a href="/admin/sellers" className="rounded-[12px] border border-[rgba(48,86,211,0.2)] p-4 hover:bg-[rgba(48,86,211,0.04)]"><div className="text-[14px] font-bold text-[#0e1b4d]">Approve Sellers</div><div className="text-[12px] text-[#6b7280] mt-0.5">{p.pendingSellers} waiting</div></a>
            <a href="/admin/products" className="rounded-[12px] border border-[rgba(48,86,211,0.2)] p-4 hover:bg-[rgba(48,86,211,0.04)]"><div className="text-[14px] font-bold text-[#0e1b4d]">Approve Products</div><div className="text-[12px] text-[#6b7280] mt-0.5">{p.pendingProducts} waiting</div></a>
            <div className="rounded-[12px] border border-[#eef0f5] p-4 opacity-60"><div className="text-[14px] font-bold text-[#0e1b4d]">Manage Commission</div><div className="text-[12px] text-[#6b7280] mt-0.5">Coming soon</div></div>
            <div className="rounded-[12px] border border-[#eef0f5] p-4 opacity-60"><div className="text-[14px] font-bold text-[#0e1b4d]">Manage Banners</div><div className="text-[12px] text-[#6b7280] mt-0.5">Coming soon</div></div>
          </div>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
