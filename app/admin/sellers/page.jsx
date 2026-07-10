"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { SectionCard, Badge } from "@/components/seller/ui";
import { inrShort } from "@/lib/seller/models";

export default function Page() {
  const [pending, setPending] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await (await fetch("/api/admin/sellers")).json();
      if (r.ok) { setPending(r.pending); setActive(r.active); }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function decide(id, decision) {
    setBusy(id);
    try {
      const r = await (await fetch(`/api/admin/sellers/${id}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision }),
      })).json();
      if (r.ok) await load();
    } finally { setBusy(""); }
  }

  return (
    <AdminShell active="/admin/sellers" title="Sellers" subtitle="Approve applications & manage sellers">
      <SectionCard title={`Pending applications (${pending.length})`} className="mb-4">
        {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : pending.length === 0 ? (
          <p className="text-[13px] text-[#6b7280]">No pending applications. 🎉</p>
        ) : (
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[720px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Application</th><th className="pb-2 font-semibold">Company</th><th className="pb-2 font-semibold">GSTIN</th><th className="pb-2 font-semibold">Categories</th><th className="pb-2 font-semibold">Docs</th><th className="pb-2 font-semibold text-right">Decision</th></tr></thead>
              <tbody>
                {pending.map((s) => (
                  <tr key={s.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="ID">{s.ref}</td>
                    <td className="py-2.5" data-label="Company"><div className="text-[#0e1b4d] font-semibold">{s.company}</div><div className="text-[12px] text-[#6b7280]">{s.owner}</div></td>
                    <td className="py-2.5 text-[#6b7280]" data-label="GSTIN">{s.gstin}</td>
                    <td className="py-2.5 text-[#374151]" data-label="Categories">{s.categories.join(", ") || "—"}</td>
                    <td className="py-2.5" data-label="Docs"><Badge tone="blue">{s.docs} files</Badge></td>
                    <td className="py-2.5" data-label="Decision"><div className="flex items-center justify-end gap-1.5"><button disabled={busy === s.id} onClick={() => decide(s.id, "approve")} className="h-[30px] px-3 rounded-full bg-[#1E7A5A] text-white text-[12px] font-bold disabled:opacity-50">Approve</button><button disabled={busy === s.id} onClick={() => decide(s.id, "reject")} className="h-[30px] px-3 rounded-full border border-[#d23f3f] text-[#d23f3f] text-[12px] font-bold disabled:opacity-50">Reject</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title={`Active sellers (${active.length})`}>
        {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : active.length === 0 ? (
          <p className="text-[13px] text-[#6b7280]">No sellers yet.</p>
        ) : (
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[720px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">ID</th><th className="pb-2 font-semibold">Company</th><th className="pb-2 font-semibold">Products</th><th className="pb-2 font-semibold">GMV</th><th className="pb-2 font-semibold">Rating</th><th className="pb-2 font-semibold">Status</th><th className="pb-2 font-semibold text-right">Action</th></tr></thead>
              <tbody>
                {active.map((s) => (
                  <tr key={s.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="ID">{s.ref}</td>
                    <td className="py-2.5 text-[#374151]" data-label="Company">{s.company}</td>
                    <td className="py-2.5 text-[#6b7280]" data-label="Products">{s.products}</td>
                    <td className="py-2.5 text-[#6b7280]" data-label="GMV">{inrShort(s.gmv)}</td>
                    <td className="py-2.5 text-[#6b7280]" data-label="Rating">{s.rating || "—"}</td>
                    <td className="py-2.5" data-label="Status"><Badge tone={s.status === "approved" ? "green" : s.status === "suspended" ? "red" : "amber"}>{s.status}</Badge></td>
                    <td className="py-2.5 text-right" data-label="Action">{s.status === "approved" ? <button disabled={busy === s.id} onClick={() => decide(s.id, "suspend")} className="text-[12px] font-semibold text-[#d23f3f] disabled:opacity-50">Suspend</button> : <button disabled={busy === s.id} onClick={() => decide(s.id, "reinstate")} className="text-[12px] font-semibold text-[#1E7A5A] disabled:opacity-50">Reinstate</button>}</td>
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
