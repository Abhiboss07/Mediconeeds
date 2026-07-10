"use client";
import { useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { SectionCard, Badge } from "@/components/seller/ui";
import { TextField, TextArea, SelectField } from "@/components/forms/FormKit";
import { useSellerStore } from "@/lib/seller/store";
import { createTicket } from "@/lib/seller/api";
import { site } from "@/lib/site";

const FAQS = [
  { q: "How long does product approval take?", a: "Most listings are reviewed within 24 hours. Complex medical devices may take up to 3 business days." },
  { q: "When are settlements paid?", a: "Weekly, every Monday, for orders delivered in the previous cycle. Commission and TDS are deducted automatically." },
  { q: "How do I handle returns?", a: "Buyers raise returns from their account; you'll be notified and can approve or dispute within 48 hours." },
  { q: "Can I run my own discounts?", a: "Yes — create coupons from Wallet → Coupons, or enrol products into Mediconeeds seasonal campaigns." },
];
const CH = { open: "amber", answered: "blue", closed: "green" };

export default function Page() {
  const s = useSellerStore();
  const [v, setV] = useState({ priority: "normal" });
  const [sent, setSent] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (name, val) => setV((st) => ({ ...st, [name]: val }));

  const submit = async () => {
    if (!v.subject || !v.message) return;
    setBusy(true);
    try { const r = await createTicket({ subject: v.subject, message: v.message, priority: v.priority }); setSent(r.id); setV({ priority: "normal" }); }
    finally { setBusy(false); }
  };

  return (
    <SellerShell active="/seller/support" title="Support Center" subtitle="We're here to help">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {[
          { t: "Chat support", d: "Mon–Sat, 9am–7pm", b: "Start chat", i: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
          { t: "Call request", d: site.contact.phoneDisplay, b: "Request call", i: "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 2 .7 2.9a2 2 0 01-.4 2.1L8 9.9a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.4c.9.3 1.9.6 2.9.7a2 2 0 011.7 2z" },
          { t: "Email support", d: site.contact.email, b: "Send email", i: "M4 4h16v16H4zM4 4l8 8 8-8" },
        ].map((c) => (
          <div key={c.t} className="rounded-[16px] border border-[rgba(111,115,132,0.16)] bg-white p-5">
            <div className="w-11 h-11 rounded-[12px] bg-[rgba(48,86,211,0.08)] text-[#3056D3] flex items-center justify-center mb-3"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={c.i} /></svg></div>
            <h3 className="text-[15px] font-bold text-[#0e1b4d]">{c.t}</h3>
            <p className="text-[13px] text-[#6b7280] mt-0.5">{c.d}</p>
            <button className="mt-3 h-[36px] px-4 rounded-full bg-[#3056D3] text-white text-[13px] font-bold">{c.b}</button>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-4 items-start">
        <SectionCard title="Your tickets">
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[480px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Ticket</th><th className="pb-2 font-semibold">Subject</th><th className="pb-2 font-semibold">Priority</th><th className="pb-2 font-semibold">Updated</th><th className="pb-2 font-semibold">Status</th></tr></thead>
              <tbody>
                {s.tickets.map((t) => (
                  <tr key={t.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Ticket">{t.id}</td>
                    <td className="py-2.5 text-[#374151] max-w-[220px] truncate" data-label="Subject">{t.subject}</td>
                    <td className="py-2.5" data-label="Priority"><Badge tone={t.priority === "high" ? "red" : "gray"}>{t.priority}</Badge></td>
                    <td className="py-2.5 text-[#6b7280]" data-label="Updated">{t.updated}</td>
                    <td className="py-2.5" data-label="Status"><Badge tone={CH[t.status]}>{t.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <h3 className="text-[15px] font-extrabold text-[#0e1b4d] mb-3">FAQs</h3>
            <div className="rounded-[12px] border border-[#eef0f5] divide-y divide-[#eef0f5]">
              {FAQS.map((f) => (
                <details key={f.q} className="group p-4">
                  <summary className="flex items-center justify-between cursor-pointer list-none text-[14px] font-semibold text-[#0e1b4d]">{f.q}<span className="text-[#3056D3] text-[18px] group-open:rotate-45 transition-transform">+</span></summary>
                  <p className="text-[13px] text-[#6b7280] mt-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Raise a ticket">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-full bg-[#e6f4ee] text-[#1E7A5A] flex items-center justify-center mx-auto mb-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5L20 6"/></svg></div>
              <p className="text-[14px] font-bold text-[#0e1b4d]">Ticket created</p>
              <p className="text-[13px] text-[#6b7280] mt-1">Reference {sent}. We'll reply by email.</p>
              <button onClick={() => setSent("")} className="mt-4 text-[13px] font-semibold text-[#3056D3]">Raise another</button>
            </div>
          ) : (
            <div className="space-y-4">
              <TextField label="Subject" name="subject" value={v.subject || ""} onChange={set} placeholder="Briefly describe the issue" />
              <SelectField label="Priority" name="priority" value={v.priority} onChange={set} options={["low", "normal", "high"]} />
              <TextArea label="Message" name="message" value={v.message || ""} onChange={set} rows={4} placeholder="Give us the details…" />
              <button onClick={submit} disabled={busy} className="w-full h-[44px] rounded-full bg-[#3056D3] text-white text-[14px] font-bold disabled:opacity-60">{busy ? "Sending…" : "Submit ticket"}</button>
            </div>
          )}
        </SectionCard>
      </div>
    </SellerShell>
  );
}
