"use client";
import { useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { StatCard, Badge } from "@/components/seller/ui";
import { useSellerStore, updateStock } from "@/lib/seller/store";

// Reserved / incoming are derived demo figures (backend will supply real values).
const reservedOf = (p) => Math.min(p.stock, Math.round(p.sales * 0.04));
const incomingOf = (p) => (p.stock <= 10 ? 100 : 0);

export default function Page() {
  const s = useSellerStore();
  const [draft, setDraft] = useState({});
  const [onlyLow, setOnlyLow] = useState(false);

  const list = s.products.filter((p) => (onlyLow ? p.stock <= 10 : true));
  const low = s.products.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const out = s.products.filter((p) => p.stock === 0).length;
  const totalUnits = s.products.reduce((a, p) => a + p.stock, 0);

  const commit = (id) => { if (draft[id] !== undefined && draft[id] !== "") { updateStock(id, draft[id]); setDraft((d) => ({ ...d, [id]: undefined })); } };
  const bump = (id, cur, delta) => updateStock(id, Math.max(0, cur + delta));

  return (
    <SellerShell active="/seller/inventory" title="Inventory" subtitle="Manage stock levels across your catalogue">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <StatCard label="Total SKUs" value={s.products.length} tone="blue" icon="◱" />
        <StatCard label="Units in stock" value={totalUnits.toLocaleString("en-IN")} tone="green" icon="✓" />
        <StatCard label="Low stock" value={low} sub="≤ 10 units" tone="amber" icon="!" />
        <StatCard label="Out of stock" value={out} tone="red" icon="✕" />
      </div>

      <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#0e1b4d] mb-3 cursor-pointer">
        <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="w-[15px] h-[15px] accent-[#3056D3]" />
        Show only low / out of stock
      </label>

      <div className="rounded-[16px] border border-[rgba(111,115,132,0.16)] bg-white overflow-hidden">
        <div className="overflow-x-auto mc-rtable-wrap">
          <table className="w-full text-[13px] min-w-[820px] mc-rtable">
            <thead>
              <tr className="text-[#6b7280] text-left bg-[#fafbff] border-b border-[#eef0f5]">
                <th className="p-3 font-semibold">Product</th><th className="p-3 font-semibold">SKU</th><th className="p-3 font-semibold">In stock</th><th className="p-3 font-semibold">Reserved</th><th className="p-3 font-semibold">Incoming</th><th className="p-3 font-semibold">Status</th><th className="p-3 font-semibold">Update quantity</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-[#f5f6fa] last:border-0 hover:bg-[#fafbff]">
                  <td className="p-3" data-label=""><div className="flex items-center gap-2.5"><img src={p.image} alt="" className="w-9 h-9 rounded-[8px] object-contain border border-[#eef0f5] bg-white shrink-0" /><span className="font-semibold text-[#0e1b4d] max-w-[200px] truncate">{p.name}</span></div></td>
                  <td className="p-3 text-[#6b7280]" data-label="SKU">{p.sku}</td>
                  <td className="p-3 font-bold text-[#0e1b4d]" data-label="In stock">{p.stock}</td>
                  <td className="p-3 text-[#6b7280]" data-label="Reserved">{reservedOf(p)}</td>
                  <td className="p-3 text-[#6b7280]" data-label="Incoming">{incomingOf(p)}</td>
                  <td className="p-3" data-label="Status">{p.stock === 0 ? <Badge tone="red">Out of stock</Badge> : p.stock <= 10 ? <Badge tone="amber">Low</Badge> : <Badge tone="green">In stock</Badge>}</td>
                  <td className="p-3" data-label="Update">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => bump(p.id, p.stock, -1)} className="w-[30px] h-[30px] rounded-[8px] border border-[rgba(111,115,132,0.35)] font-bold text-[#0e1b4d]">−</button>
                      <input type="number" value={draft[p.id] ?? ""} placeholder={String(p.stock)} onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                        className="w-[64px] h-[30px] px-2 rounded-[8px] border border-[rgba(111,115,132,0.4)] text-[13px] text-center outline-none focus:border-[#3056D3]" />
                      <button onClick={() => bump(p.id, p.stock, +1)} className="w-[30px] h-[30px] rounded-[8px] border border-[rgba(111,115,132,0.35)] font-bold text-[#0e1b4d]">+</button>
                      <button onClick={() => commit(p.id)} className="h-[30px] px-3 rounded-[8px] bg-[#3056D3] text-white text-[12px] font-bold">Set</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SellerShell>
  );
}
