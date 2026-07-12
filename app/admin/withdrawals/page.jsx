"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { StatCard, SectionCard, Badge } from "@/components/seller/ui";
import { inr } from "@/lib/seller/models";

const TONE = { pending: "amber", approved: "blue", paid: "green", rejected: "red" };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await (await fetch("/api/admin/withdrawals")).json();
      if (r.ok) setRows(r.withdrawals);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function act(id, action) {
    setErr("");
    let reason, txnRef;
    if (action === "reject") { reason = window.prompt("Reason for rejection (optional):") ?? ""; }
    if (action === "paid") { txnRef = window.prompt("Bank/UTR transaction reference (optional):") ?? ""; }
    setBusy(id + action);
    try {
      const r = await (await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, reason, txnRef }),
      })).json();
      if (r.ok) await load();
      else setErr(r.error || "Action failed");
    } finally { setBusy(""); }
  }

  const totals = rows.reduce((a, w) => { a[w.status] = (a[w.status] || 0) + 1; a[w.status + "Amt"] = (a[w.status + "Amt"] || 0) + w.amount; return a; }, {});

  return (
    <AdminShell active="/admin/withdrawals" title="Withdrawal Requests" subtitle="Approve, reject & settle seller payouts">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-5">
        <StatCard label="Pending" value={totals.pending || 0} sub={inr(totals.pendingAmt || 0)} tone="amber" icon="◷" />
        <StatCard label="Approved" value={totals.approved || 0} sub={inr(totals.approvedAmt || 0)} tone="blue" icon="✓" />
        <StatCard label="Paid" value={totals.paid || 0} sub={inr(totals.paidAmt || 0)} tone="green" icon="₹" />
        <StatCard label="Rejected" value={totals.rejected || 0} sub={inr(totals.rejectedAmt || 0)} tone="red" icon="✕" />
      </div>

      {err && <div className="mb-4 text-[13px] font-semibold text-[#d23f3f] bg-[#fdecec] rounded-[10px] px-4 py-2.5">{err}</div>}

      <SectionCard title={`All requests (${rows.length})`}>
        {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : rows.length === 0 ? (
          <p className="text-[13px] text-[#6b7280]">No withdrawal requests yet.</p>
        ) : (
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[860px]">
              <thead>
                <tr className="text-[#6b7280] text-left border-b border-[#eef0f5]">
                  <th className="pb-2 font-semibold">Reference</th>
                  <th className="pb-2 font-semibold">Seller</th>
                  <th className="pb-2 font-semibold">Amount</th>
                  <th className="pb-2 font-semibold">Bank</th>
                  <th className="pb-2 font-semibold">IFSC</th>
                  <th className="pb-2 font-semibold">Created</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id} className="border-b border-[#f5f6fa] last:border-0 align-top">
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Reference">{w.reference}</td>
                    <td className="py-2.5" data-label="Seller"><div className="text-[#0e1b4d] font-semibold">{w.sellerName}</div><div className="text-[12px] text-[#6b7280]">{w.sellerEmail || "—"}</div></td>
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Amount">{inr(w.amount)}</td>
                    <td className="py-2.5 text-[#374151]" data-label="Bank"><div>{w.bank.bankName || "—"}</div><div className="text-[12px] text-[#6b7280]">{w.bank.account || "—"}</div></td>
                    <td className="py-2.5 text-[#6b7280]" data-label="IFSC">{w.bank.ifsc || "—"}</td>
                    <td className="py-2.5 text-[#6b7280]" data-label="Created">{fmtDate(w.createdAt)}</td>
                    <td className="py-2.5" data-label="Status"><Badge tone={TONE[w.status]}>{w.status}</Badge>{w.status === "rejected" && w.rejectionReason ? <div className="text-[11px] text-[#d23f3f] mt-1">{w.rejectionReason}</div> : null}{w.status === "paid" && w.txnRef ? <div className="text-[11px] text-[#6b7280] mt-1">Ref {w.txnRef}</div> : null}</td>
                    <td className="py-2.5" data-label="Actions">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {w.status === "pending" && <button disabled={!!busy} onClick={() => act(w.id, "approve")} className="h-[30px] px-3 rounded-full bg-[#1E7A5A] text-white text-[12px] font-bold disabled:opacity-50">Approve</button>}
                        {(w.status === "pending" || w.status === "approved") && <button disabled={!!busy} onClick={() => act(w.id, "reject")} className="h-[30px] px-3 rounded-full border border-[#d23f3f] text-[#d23f3f] text-[12px] font-bold disabled:opacity-50">Reject</button>}
                        {w.status === "approved" && <button disabled={!!busy} onClick={() => act(w.id, "paid")} className="h-[30px] px-3 rounded-full bg-[#3056D3] text-white text-[12px] font-bold disabled:opacity-50">Mark Paid</button>}
                        {(w.status === "paid" || w.status === "rejected") && <span className="text-[12px] text-[#9ca3af]">—</span>}
                      </div>
                    </td>
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
