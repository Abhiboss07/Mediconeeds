"use client";
import { useEffect, useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { SectionCard, Badge } from "@/components/seller/ui";

const TONE = { validated: "blue", importing: "amber", completed: "green", partial: "amber", failed: "red" };
const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

export default function Page() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try { const r = await (await fetch("/api/seller/bulk/history")).json(); if (r.ok) setBatches(r.batches); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function retry(id) {
    setErr(""); setBusy(id);
    try {
      const r = await (await fetch("/api/seller/bulk/retry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ batchId: id }) })).json();
      if (!r.ok) { setErr(r.error || "Retry failed"); return; }
      sessionStorage.setItem("bulk:retry", JSON.stringify({ batchId: r.batchId, rows: r.rows, summary: r.summary }));
      window.location.href = "/seller/products/bulk";
    } finally { setBusy(""); }
  }

  const dl = (url) => { const a = document.createElement("a"); a.href = url; a.click(); };

  return (
    <SellerShell active="/seller/products/bulk" title="Bulk Upload History"
      subtitle="Every import, its outcome and error report"
      actions={<a href="/seller/products/bulk" className="h-[38px] px-4 rounded-full bg-[#3056D3] text-white text-[12.5px] font-bold inline-flex items-center">+ New import</a>}>
      {err && <div className="mb-4 text-[13px] font-semibold text-[#d23f3f] bg-[#fdecec] rounded-[10px] px-4 py-2.5">{err}</div>}
      <SectionCard title={`Imports (${batches.length})`}>
        {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : batches.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[14px] font-semibold text-[#0e1b4d]">No imports yet</p>
            <p className="text-[13px] text-[#6b7280] mt-1">Your bulk uploads will appear here.</p>
            <a href="/seller/products/bulk" className="inline-block mt-4 h-[40px] leading-[40px] px-5 rounded-full bg-[#3056D3] text-white text-[13px] font-bold">Start an import</a>
          </div>
        ) : (
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[840px]">
              <thead>
                <tr className="text-[#6b7280] text-left border-b border-[#eef0f5]">
                  <th className="pb-2 font-semibold">Import Date</th><th className="pb-2 font-semibold">File</th><th className="pb-2 font-semibold">Rows</th>
                  <th className="pb-2 font-semibold">Success</th><th className="pb-2 font-semibold">Failed</th><th className="pb-2 font-semibold">Rejected</th>
                  <th className="pb-2 font-semibold">Pending</th><th className="pb-2 font-semibold">Status</th><th className="pb-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5 text-[#374151]" data-label="Date">{fmt(b.createdAt)}</td>
                    <td className="py-2.5" data-label="File"><div className="font-semibold text-[#0e1b4d] max-w-[180px] truncate">{b.filename}</div><div className="text-[11px] text-[#6b7280] uppercase">{b.source}{b.isRetry ? " · retry" : ""}{b.hasImagesZip ? " · zip" : ""}</div></td>
                    <td className="py-2.5 text-[#374151]" data-label="Rows">{b.counts.total}</td>
                    <td className="py-2.5 font-semibold text-[#1E7A5A]" data-label="Success">{b.counts.success}</td>
                    <td className="py-2.5 font-semibold text-[#d23f3f]" data-label="Failed">{b.counts.failed}</td>
                    <td className="py-2.5 font-semibold text-[#b7791f]" data-label="Rejected">{b.counts.errors || 0}</td>
                    <td className="py-2.5 text-[#3056D3]" data-label="Pending">{b.counts.pending}</td>
                    <td className="py-2.5" data-label="Status"><Badge tone={TONE[b.status] || "gray"}>{b.status}</Badge></td>
                    <td className="py-2.5 text-right whitespace-nowrap" data-label="Actions">
                      <div className="flex items-center justify-end gap-2">
                        {(b.counts.failed > 0 || (b.counts.errors || 0) > 0) && <button onClick={() => dl(`/api/seller/bulk/errors/${b.id}`)} className="text-[12px] font-semibold text-[#3056D3]">Error report</button>}
                        {(b.counts.failed > 0 || (b.counts.errors || 0) > 0) && <button disabled={!!busy} onClick={() => retry(b.id)} className="text-[12px] font-semibold text-[#1E7A5A] disabled:opacity-50">{busy === b.id ? "…" : "Re-import"}</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </SellerShell>
  );
}
