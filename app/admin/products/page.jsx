"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { SectionCard, Badge } from "@/components/seller/ui";
import { inr, PRODUCT_STATUS } from "@/lib/seller/models";

export default function Page() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await (await fetch("/api/admin/products?status=all", { cache: "no-store" })).json();
      if (r.ok) setAll(r.products);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function decide(id, decision) {
    setBusy(id);
    try {
      const r = await (await fetch(`/api/admin/products/${id}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision }),
      })).json();
      if (r.ok) await load();
    } finally { setBusy(""); }
  }

  const pending = all.filter((p) => p.status === "pending");
  const reviewed = all.filter((p) => ["active", "rejected"].includes(p.status));

  return (
    <AdminShell active="/admin/products" title="Product Approvals" subtitle="Review seller listings for quality & compliance">
      <SectionCard title={`Awaiting approval (${pending.length})`} className="mb-4">
        {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : pending.length === 0 ? (
          <p className="text-[13px] text-[#6b7280]">Nothing pending review. 🎉</p>
        ) : (
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[720px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Product</th><th className="pb-2 font-semibold">Seller</th><th className="pb-2 font-semibold">Category</th><th className="pb-2 font-semibold">Price</th><th className="pb-2 font-semibold text-right">Decision</th></tr></thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5" data-label=""><div className="flex items-center gap-2.5"><img src={p.image} alt="" className="w-9 h-9 rounded-[8px] object-contain border border-[#eef0f5] bg-white shrink-0" /><div className="min-w-0"><div className="flex items-center gap-1.5"><span className="font-semibold text-[#0e1b4d] max-w-[200px] truncate">{p.name}</span>{p.bulk && <Badge tone="indigo">Bulk</Badge>}</div>{p.bulk && <div className="text-[11px] text-[#6b7280]">Batch #{p.batchId} · {new Date(p.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</div>}</div></div></td>
                    <td className="py-2.5 text-[#6b7280]" data-label="Seller">{p.seller}</td>
                    <td className="py-2.5 text-[#374151]" data-label="Category">{p.category}</td>
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Price">{inr(p.price)}</td>
                    <td className="py-2.5" data-label="Decision"><div className="flex items-center justify-end gap-1.5"><button disabled={busy === p.id} onClick={() => decide(p.id, "approve")} className="h-[30px] px-3 rounded-full bg-[#1E7A5A] text-white text-[12px] font-bold disabled:opacity-50">Approve</button><button disabled={busy === p.id} onClick={() => decide(p.id, "reject")} className="h-[30px] px-3 rounded-full border border-[#d23f3f] text-[#d23f3f] text-[12px] font-bold disabled:opacity-50">Reject</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Reviewed listings">
        {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : reviewed.length === 0 ? (
          <p className="text-[13px] text-[#6b7280]">No reviewed listings yet.</p>
        ) : (
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[640px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Product</th><th className="pb-2 font-semibold">Category</th><th className="pb-2 font-semibold">Status</th><th className="pb-2 font-semibold text-right">Action</th></tr></thead>
              <tbody>
                {reviewed.map((p) => (
                  <tr key={p.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label=""><span className="max-w-[220px] truncate inline-block align-middle">{p.name}</span>{p.bulk && <span className="ml-1.5 align-middle"><Badge tone="indigo">Bulk</Badge></span>}</td>
                    <td className="py-2.5 text-[#374151]" data-label="Category">{p.category}</td>
                    <td className="py-2.5" data-label="Status"><Badge tone={PRODUCT_STATUS[p.status].tone}>{PRODUCT_STATUS[p.status].label}</Badge></td>
                    <td className="py-2.5 text-right" data-label="Action">{p.status === "active" ? <button disabled={busy === p.id} onClick={() => decide(p.id, "reject")} className="text-[12px] font-semibold text-[#d23f3f] disabled:opacity-50">Reject</button> : <button disabled={busy === p.id} onClick={() => decide(p.id, "approve")} className="text-[12px] font-semibold text-[#1E7A5A] disabled:opacity-50">Approve</button>}</td>
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
