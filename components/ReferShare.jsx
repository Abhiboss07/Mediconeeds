"use client";
import { useEffect, useState } from "react";

export default function ReferShare({ code = "MEDI-REFER" }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => { setLink(`${window.location.origin}/signup?ref=${code}`); }, [code]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(link || `${code}`); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch {}
  };
  const wa = `https://wa.me/?text=${encodeURIComponent(`Shop dermatologist-formulated Dr Awish skincare on Mediconeeds — use my link: ${link}`)}`;

  return (
    <div className="rounded-[16px] border border-[rgba(48,86,211,0.2)] bg-white p-5">
      <div className="text-[12px] font-bold tracking-[0.1em] uppercase text-[#3056D3] mb-2">Your referral link</div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input readOnly value={link || `Loading…`} className="flex-1 h-[44px] px-3 rounded-[10px] border border-[rgba(111,115,132,0.35)] text-[13px] bg-[#f7f8fd] text-[#0e1b4d]" />
        <button onClick={copy} className="h-[44px] px-5 rounded-[10px] bg-[#3056D3] text-white text-[13px] font-bold whitespace-nowrap">{copied ? "Copied ✓" : "Copy link"}</button>
        <a href={wa} target="_blank" rel="noreferrer" className="h-[44px] px-5 rounded-[10px] border border-[#1e7a5a] text-[#1e7a5a] text-[13px] font-bold flex items-center justify-center whitespace-nowrap">Share on WhatsApp</a>
      </div>
      <p className="text-[12px] text-[#6b7280] mt-2">Referral code: <b className="text-[#0e1b4d]">{code}</b></p>
    </div>
  );
}
