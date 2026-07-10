"use client";
import { useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { StatCard, SectionCard, Badge } from "@/components/seller/ui";
import { useSellerStore } from "@/lib/seller/store";
import { requestWithdrawal } from "@/lib/seller/api";
import { inr, SETTLEMENT_STATUS } from "@/lib/seller/models";

export default function Page() {
  const s = useSellerStore();
  const w = s.settlements;
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const withdraw = async () => {
    setBusy(true);
    try { const r = await requestWithdrawal(w.pending); setMsg(`Withdrawal ${r.ref} requested for ${inr(r.amount)} — credited in ${r.eta}.`); }
    finally { setBusy(false); }
  };

  return (
    <SellerShell active="/seller/wallet" title="Wallet & Settlements" subtitle={`Commission ${w.commissionRate}% · fixed weekly cycle`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard label="Pending payout" value={inr(w.pending)} sub="available soon" tone="amber" icon="◷" />
        <StatCard label="Upcoming" value={inr(w.upcoming)} sub="next cycle" tone="blue" icon="→" />
        <StatCard label="Paid to date" value={inr(w.paid)} tone="green" icon="✓" />
        <StatCard label="Commission" value={w.commissionRate + "%"} sub="per order" tone="indigo" icon="%" />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-4 mt-5 items-start">
        <SectionCard title="Settlement history" action={<button className="text-[12px] font-semibold text-[#3056D3]">Download GST report</button>}>
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[560px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Settlement</th><th className="pb-2 font-semibold">Date</th><th className="pb-2 font-semibold">Gross</th><th className="pb-2 font-semibold">Commission</th><th className="pb-2 font-semibold">Net</th><th className="pb-2 font-semibold">Status</th><th className="pb-2 font-semibold text-right">Invoice</th></tr></thead>
              <tbody>
                {w.history.map((h) => (
                  <tr key={h.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Settlement">{h.id}</td>
                    <td className="py-2.5 text-[#6b7280]" data-label="Date">{h.date}</td>
                    <td className="py-2.5 text-[#374151]" data-label="Gross">{inr(h.gross)}</td>
                    <td className="py-2.5 text-[#d23f3f]" data-label="Commission">−{inr(h.commission)}</td>
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Net">{inr(h.net)}</td>
                    <td className="py-2.5" data-label="Status"><Badge tone={SETTLEMENT_STATUS[h.status].tone}>{SETTLEMENT_STATUS[h.status].label}</Badge></td>
                    <td className="py-2.5 text-right" data-label="Invoice"><button className="text-[12px] font-semibold text-[#3056D3]">PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <aside className="space-y-4">
          <SectionCard title="Withdraw">
            <p className="text-[13px] text-[#6b7280] mb-1">Available to withdraw</p>
            <p className="text-[26px] font-extrabold text-[#0e1b4d] mb-3">{inr(w.pending)}</p>
            <button onClick={withdraw} disabled={busy} className="w-full h-[44px] rounded-full bg-[#1E7A5A] text-white text-[14px] font-bold disabled:opacity-60">{busy ? "Requesting…" : "Request withdrawal"}</button>
            {msg && <p className="text-[12.5px] text-[#1E7A5A] font-semibold mt-3">{msg}</p>}
            <div className="mt-4 pt-3 border-t border-[#eef0f5] text-[13px]">
              <p className="text-[#6b7280]">Settlement account</p>
              <p className="font-semibold text-[#0e1b4d]">{s.seller.bank.name}</p>
              <p className="text-[#6b7280]">{s.seller.bank.account} · {s.seller.bank.ifsc}</p>
            </div>
          </SectionCard>
          <SectionCard title="Invoices & reports">
            <div className="space-y-2 text-[13px]">
              <button className="w-full text-left flex items-center justify-between hover:text-[#3056D3]"><span>Monthly GST summary</span><span>↓</span></button>
              <button className="w-full text-left flex items-center justify-between hover:text-[#3056D3]"><span>TDS certificate</span><span>↓</span></button>
              <button className="w-full text-left flex items-center justify-between hover:text-[#3056D3]"><span>Commission invoices</span><span>↓</span></button>
            </div>
          </SectionCard>
        </aside>
      </div>
    </SellerShell>
  );
}
