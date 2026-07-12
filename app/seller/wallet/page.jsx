"use client";
import { useEffect, useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { StatCard, SectionCard, Badge } from "@/components/seller/ui";
import { inr, SETTLEMENT_STATUS } from "@/lib/seller/models";

const WD_TONE = { pending: "amber", approved: "blue", paid: "green", rejected: "red" };
const WD_LABEL = { pending: "Pending", approved: "Approved", paid: "Paid", rejected: "Rejected" };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtDay = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—");

export default function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  async function load() {
    try {
      const r = await (await fetch("/api/seller/wallet")).json();
      if (r.ok) setData(r);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const bal = data?.balances || {};
  const settlements = data?.settlements || [];
  const withdrawals = data?.withdrawals || [];
  const wdCounts = withdrawals.reduce((a, w) => { a[w.status] = (a[w.status] || 0) + 1; return a; }, {});

  return (
    <SellerShell active="/seller/wallet" title="Wallet & Settlements" subtitle={`Commission ${bal.commissionRate ?? 8}% · fixed weekly cycle`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Available balance" value={inr(bal.available || 0)} sub="withdrawable now" tone="green" icon="₹" />
        <StatCard label="Upcoming" value={inr(bal.upcoming || 0)} sub="next cycle" tone="blue" icon="→" />
        <StatCard label="Processing" value={inr(bal.processing || 0)} sub="in settlement" tone="amber" icon="◷" />
        <StatCard label="Paid out to date" value={inr(bal.paidOut || 0)} tone="indigo" icon="✓" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 mt-5 items-start">
        <SectionCard
          title="Settlement history"
          action={settlements.length ? <a href="/api/seller/wallet/gst-report" className="text-[12px] font-semibold text-[#3056D3] hover:underline">Download GST report ↓</a> : null}
        >
          {loading ? (
            <p className="text-[13px] text-[#6b7280]">Loading…</p>
          ) : settlements.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-[#eef2ff] text-[#3056D3] flex items-center justify-center mx-auto text-[20px]">₹</div>
              <p className="text-[14px] font-semibold text-[#0e1b4d] mt-3">No settlements yet</p>
              <p className="text-[13px] text-[#6b7280] mt-1">Settlements appear here after your delivered orders complete a payout cycle.</p>
            </div>
          ) : (
            <div className="overflow-x-auto mc-rtable-wrap">
              <table className="w-full text-[13px] mc-rtable min-w-[560px]">
                <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Settlement</th><th className="pb-2 font-semibold">Date</th><th className="pb-2 font-semibold">Gross</th><th className="pb-2 font-semibold">Commission</th><th className="pb-2 font-semibold">Net</th><th className="pb-2 font-semibold">Status</th><th className="pb-2 font-semibold text-right">Invoice</th></tr></thead>
                <tbody>
                  {settlements.map((h) => (
                    <tr key={h.id} className="border-b border-[#f5f6fa] last:border-0">
                      <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Settlement">{h.settlementNo}</td>
                      <td className="py-2.5 text-[#6b7280]" data-label="Date">{fmtDate(h.date)}</td>
                      <td className="py-2.5 text-[#374151]" data-label="Gross">{inr(h.gross)}</td>
                      <td className="py-2.5 text-[#d23f3f]" data-label="Commission">−{inr(h.commission)}</td>
                      <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Net">{inr(h.net)}</td>
                      <td className="py-2.5" data-label="Status"><Badge tone={SETTLEMENT_STATUS[h.status]?.tone || "gray"}>{SETTLEMENT_STATUS[h.status]?.label || h.status}</Badge></td>
                      <td className="py-2.5 text-right" data-label="Invoice"><a href={`/api/seller/settlements/${h.id}/invoice`} className="text-[12px] font-semibold text-[#3056D3] hover:underline">PDF ↓</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <aside className="space-y-4">
          <SectionCard title="Withdraw">
            <p className="text-[13px] text-[#6b7280] mb-1">Available to withdraw</p>
            <p className="text-[26px] font-extrabold text-[#0e1b4d] mb-1">{inr(bal.available || 0)}</p>
            {bal.reserved > 0 && <p className="text-[12px] text-[#b7791f] mb-3">{inr(bal.reserved)} reserved in pending requests</p>}
            <button onClick={() => setModal(true)} disabled={loading} className="w-full h-[44px] mt-2 rounded-full bg-[#1E7A5A] text-white text-[14px] font-bold disabled:opacity-60">Request withdrawal</button>
            <div className="mt-4 pt-3 border-t border-[#eef0f5] text-[13px]">
              <p className="text-[#6b7280]">Settlement account</p>
              <p className="font-semibold text-[#0e1b4d]">{data?.bank?.bankName || "Not set — add in the request form"}</p>
              {data?.bank?.account ? <p className="text-[#6b7280]">{data.bank.account} · {data.bank.ifsc}</p> : null}
            </div>
          </SectionCard>

          <SectionCard title="Withdrawal status">
            <div className="grid grid-cols-4 gap-2 text-center">
              {["pending", "approved", "paid", "rejected"].map((k) => (
                <div key={k}>
                  <p className="text-[18px] font-extrabold text-[#0e1b4d]">{wdCounts[k] || 0}</p>
                  <p className="text-[11px] text-[#6b7280]">{WD_LABEL[k]}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </aside>
      </div>

      <SectionCard title={`Withdrawal requests (${withdrawals.length})`} className="mt-4">
        {loading ? (
          <p className="text-[13px] text-[#6b7280]">Loading…</p>
        ) : withdrawals.length === 0 ? (
          <p className="text-[13px] text-[#6b7280]">No withdrawal requests yet. Request a payout from your available balance above.</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="rounded-[12px] border border-[#eef0f5] p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-semibold text-[#0e1b4d]">{w.reference}</span>
                    <span className="text-[#6b7280] text-[13px]"> · {inr(w.amount)} · {fmtDate(w.createdAt)}</span>
                  </div>
                  <Badge tone={WD_TONE[w.status]}>{WD_LABEL[w.status]}</Badge>
                </div>
                {w.status === "rejected" && w.rejectionReason ? <p className="text-[12px] text-[#d23f3f] mt-1">Reason: {w.rejectionReason}</p> : null}
                {w.status === "paid" && w.txnRef ? <p className="text-[12px] text-[#6b7280] mt-1">Transaction ref: {w.txnRef}</p> : null}
                {/* Status timeline */}
                <div className="flex items-center gap-1 mt-3 flex-wrap">
                  {w.timeline.map((t, i) => (
                    <div key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-[#d1d5db]">→</span>}
                      <span className="inline-flex items-center gap-1 text-[11.5px] text-[#374151]">
                        <span className={`w-2 h-2 rounded-full ${t.status === "rejected" ? "bg-[#d23f3f]" : t.status === "paid" ? "bg-[#1E7A5A]" : t.status === "approved" ? "bg-[#3056D3]" : "bg-[#b7791f]"}`} />
                        {WD_LABEL[t.status] || t.status}<span className="text-[#9ca3af]"> · {fmtDay(t.at)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {modal && (
        <WithdrawModal
          available={bal.available || 0}
          bank={data?.bank}
          onClose={() => setModal(false)}
          onDone={async () => { setModal(false); setLoading(true); await load(); }}
        />
      )}
    </SellerShell>
  );
}

function WithdrawModal({ available, bank, onClose, onDone }) {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState(bank?.bankName || "");
  const [account, setAccount] = useState(bank?.account || "");
  const [ifsc, setIfsc] = useState(bank?.ifsc || "");
  const [remark, setRemark] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    const amt = Number(amount);
    if (!amt || amt <= 0) return setErr("Enter a valid amount.");
    if (amt > available) return setErr(`Amount exceeds your available balance of ${inr(available)}.`);
    if (!account || account.length < 4) return setErr("Enter a valid account number.");
    if (!ifsc || ifsc.length < 4) return setErr("Enter a valid IFSC code.");
    setBusy(true);
    try {
      const r = await (await fetch("/api/seller/withdrawals", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ amount: amt, bankName, account, ifsc, remark }),
      })).json();
      if (r.ok) onDone();
      else setErr(r.error || "Could not submit request.");
    } catch { setErr("Network error. Try again."); }
    finally { setBusy(false); }
  }

  const field = "w-full h-[42px] px-3 rounded-[10px] border border-[#e2e5ee] text-[14px] focus:border-[#3056D3] outline-none";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <form onSubmit={submit} className="relative bg-white rounded-[16px] w-full max-w-[440px] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[17px] font-extrabold text-[#0e1b4d]">Request withdrawal</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[#9ca3af] text-[22px] leading-none">×</button>
        </div>
        <p className="text-[13px] text-[#6b7280] mb-4">Available balance: <span className="font-bold text-[#1E7A5A]">{inr(available)}</span></p>

        <label className="block text-[12px] font-semibold text-[#374151] mb-1">Amount (₹)</label>
        <input className={field} type="number" min="1" max={available} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 25000" autoFocus />

        <label className="block text-[12px] font-semibold text-[#374151] mb-1 mt-3">Bank name</label>
        <input className={field} value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" />

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Account number</label>
            <input className={field} value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Account no." />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">IFSC</label>
            <input className={field} value={ifsc} onChange={(e) => setIfsc(e.target.value.toUpperCase())} placeholder="IFSC" />
          </div>
        </div>

        <label className="block text-[12px] font-semibold text-[#374151] mb-1 mt-3">Remark (optional)</label>
        <input className={field} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Note for the finance team" />

        {err && <p className="text-[12.5px] text-[#d23f3f] font-semibold mt-3">{err}</p>}

        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 h-[44px] rounded-full border border-[#e2e5ee] text-[14px] font-bold text-[#374151]">Cancel</button>
          <button type="submit" disabled={busy} className="flex-1 h-[44px] rounded-full bg-[#1E7A5A] text-white text-[14px] font-bold disabled:opacity-60">{busy ? "Submitting…" : "Submit request"}</button>
        </div>
      </form>
    </div>
  );
}
