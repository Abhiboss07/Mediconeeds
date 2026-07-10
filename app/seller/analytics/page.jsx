"use client";
import { useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { StatCard, SectionCard, BarChart, LineChart, Donut } from "@/components/seller/ui";
import { useSellerStore } from "@/lib/seller/store";
import { inr, inrShort } from "@/lib/seller/models";

const RANGES = ["7 days", "30 days", "6 months", "1 year"];

export default function Page() {
  const s = useSellerStore();
  const a = s.analytics;
  const [range, setRange] = useState("6 months");
  const revenue = a.revenueMonthly.reduce((x, y) => x + y.val, 0);
  const orders = a.ordersMonthly.reduce((x, y) => x + y.val, 0);

  const Actions = (
    <select value={range} onChange={(e) => setRange(e.target.value)} className="h-[38px] px-3 rounded-full border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold bg-white text-[#0e1b4d]">
      {RANGES.map((r) => <option key={r}>{r}</option>)}
    </select>
  );

  return (
    <SellerShell active="/seller/analytics" title="Analytics" subtitle="Understand your store performance" actions={Actions}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Revenue" value={inrShort(revenue)} sub={`${range}`} tone="green" icon="₹" />
        <StatCard label="Orders" value={orders} sub="+16% vs prev" tone="blue" icon="◫" />
        <StatCard label="Visitors" value={a.visitors.toLocaleString("en-IN")} tone="violet" icon="◉" />
        <StatCard label="Conversion" value={a.conversion + "%"} sub={`Repeat ${a.repeatRate}%`} tone="indigo" icon="↑" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-5">
        <SectionCard title="Monthly revenue"><LineChart data={a.revenueMonthly} height={210} /></SectionCard>
        <SectionCard title="Monthly orders"><BarChart data={a.ordersMonthly} height={210} /></SectionCard>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4 mt-4">
        <SectionCard title="Top products">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Product</th><th className="pb-2 font-semibold">Units</th><th className="pb-2 font-semibold">Revenue</th><th className="pb-2 font-semibold">Share</th></tr></thead>
              <tbody>
                {a.topProducts.map((p, i) => {
                  const share = Math.round((p.revenue / a.topProducts.reduce((x, y) => x + y.revenue, 0)) * 100);
                  return (
                    <tr key={p.name} className="border-b border-[#f5f6fa] last:border-0">
                      <td className="py-2.5 font-semibold text-[#0e1b4d]">{i + 1}. {p.name}</td>
                      <td className="py-2.5 text-[#374151]">{p.sales}</td>
                      <td className="py-2.5 font-semibold text-[#0e1b4d]">{inr(p.revenue)}</td>
                      <td className="py-2.5"><div className="flex items-center gap-2"><div className="w-[70px] h-1.5 rounded-full bg-[#eef0f5] overflow-hidden"><div className="h-full bg-[#3056D3]" style={{ width: share + "%" }} /></div><span className="text-[#6b7280]">{share}%</span></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
        <SectionCard title="Category performance"><Donut segments={a.categoryPerf} /></SectionCard>
      </div>
    </SellerShell>
  );
}
