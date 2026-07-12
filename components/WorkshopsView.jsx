"use client";
import { useState } from "react";

const inr = (n) => (n ? "₹" + Number(n).toLocaleString("en-IN") : "Free");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

function WorkshopCard({ w, past, onRegister }) {
  return (
    <div className="rounded-[16px] border border-[rgba(111,115,132,0.18)] bg-white overflow-hidden flex flex-col">
      <div
        className="h-[132px] bg-gradient-to-br from-[#3056D3] to-[#192c6d] relative flex items-end p-4 bg-cover bg-center"
        style={w.image ? { backgroundImage: `linear-gradient(rgba(15,20,36,0.15),rgba(15,20,36,0.35)), url(${w.image})` } : undefined}
      >
        <div className="relative">
          <span className="inline-block text-[11px] font-bold bg-white/90 text-[#3056D3] rounded-full px-2.5 py-1">{w.durationLabel || "Workshop"}</span>
        </div>
      </div>
      <div className="p-4 lg:p-5 flex flex-col flex-1">
        <h3 className="text-[16px] font-extrabold text-[#0e1b4d] leading-snug">{w.title}</h3>
        <p className="text-[13px] text-[#6b7280] mt-1.5 line-clamp-2">{w.summary}</p>
        <div className="mt-3 space-y-1.5 text-[13px] text-[#374151]">
          <div className="flex items-center gap-2"><span className="text-[#3056D3]">📅</span>{fmtDate(w.startsAt)}</div>
          <div className="flex items-center gap-2"><span className="text-[#3056D3]">📍</span>{[w.venue, w.city].filter(Boolean).join(", ") || "To be announced"}</div>
          <div className="flex items-center gap-2"><span className="text-[#3056D3]">🎟️</span><span className="font-bold text-[#0e1b4d]">{inr(w.price)}</span>{!past && w.seatsTotal ? <span className="text-[#6b7280]"> · {w.seatsLeft} seats left</span> : null}</div>
        </div>
        <div className="mt-auto pt-4">
          {past ? (
            <span className="inline-block w-full text-center h-[42px] leading-[42px] rounded-full bg-[#eef0f5] text-[#6b7280] text-[14px] font-bold">Completed</span>
          ) : (
            <button onClick={() => onRegister(w)} className="w-full h-[42px] rounded-full bg-[#3056D3] text-white text-[14px] font-bold hover:bg-[#254bc0]">Register now</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WorkshopsView({ upcoming, past, benefits, faqs }) {
  const [reg, setReg] = useState(null);

  return (
    <div className="bg-[#F7FAFF]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#3056D3] to-[#192c6d] text-white">
        <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <span className="inline-block text-[12px] font-bold tracking-[0.14em] uppercase bg-white/15 rounded-full px-3 py-1">Dr Awish Clinic · Workshops</span>
          <h1 className="text-[30px] lg:text-[46px] font-extrabold mt-4 leading-tight max-w-[42rem]">Hands-on dermatology & clinical skincare workshops</h1>
          <p className="text-[15px] lg:text-[17px] text-white/85 mt-3 max-w-[38rem]">Learn evidence-based protocols, advanced procedures and practice-building skills directly from Dr Awish and our expert faculty.</p>
          <div className="flex flex-wrap gap-6 mt-8">
            <div><div className="text-[26px] font-extrabold">{upcoming.length}</div><div className="text-[13px] text-white/70">Upcoming</div></div>
            <div><div className="text-[26px] font-extrabold">{past.length}+</div><div className="text-[13px] text-white/70">Completed</div></div>
            <div><div className="text-[26px] font-extrabold">CPD</div><div className="text-[13px] text-white/70">Certified</div></div>
          </div>
        </div>
      </section>

      <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-10 lg:py-14">
        {/* Upcoming */}
        <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d]">Upcoming workshops</h2>
        <p className="text-[14px] text-[#6b7280] mt-1 mb-6">Reserve your seat — limited capacity per cohort.</p>
        {upcoming.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#cbd5e1] bg-white p-8 text-center text-[#6b7280]">
            No upcoming workshops scheduled right now. Check back soon or <a href="/contact" className="text-[#3056D3] font-semibold">contact us</a> to be notified.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {upcoming.map((w) => <WorkshopCard key={w.id} w={w} onRegister={setReg} />)}
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <>
            <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d] mt-14">Past workshops</h2>
            <p className="text-[14px] text-[#6b7280] mt-1 mb-6">A glimpse of our recent cohorts.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {past.map((w) => <WorkshopCard key={w.id} w={w} past onRegister={setReg} />)}
            </div>
          </>
        )}

        {/* About */}
        <section className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d]">About our workshops</h2>
            <p className="text-[15px] text-[#444] leading-relaxed mt-3">Every Dr Awish workshop blends clinical theory with supervised hands-on practice on real cases and models. Small cohorts mean personal mentoring, and every attendee leaves with protocols, checklists and a certificate of participation.</p>
            <p className="text-[15px] text-[#444] leading-relaxed mt-3">Whether you're a practising dermatologist, an aesthetic physician, or a clinic owner, our sessions are designed to translate directly into confident, safe practice.</p>
          </div>
          <div className="rounded-[18px] bg-white border border-[rgba(111,115,132,0.18)] p-6">
            <h3 className="text-[17px] font-extrabold text-[#0e1b4d] mb-4">What you'll gain</h3>
            <ul className="space-y-3">
              {benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] text-[#374151]"><span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-[#e6f4ee] text-[#1E7A5A] flex items-center justify-center text-[12px] font-bold">✓</span>{b}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16 max-w-[52rem]">
          <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d] mb-6">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details key={i} className="group bg-white rounded-[14px] border border-[rgba(111,115,132,0.2)] p-5" open={i === 0}>
                <summary className="flex items-center justify-between cursor-pointer list-none text-[15px] font-bold text-[#0e1b4d]">{f.q}<span className="text-[#3056D3] text-[22px] leading-none group-open:rotate-45 transition-transform">+</span></summary>
                <p className="text-[14px] leading-relaxed text-[#444] mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="mt-16 rounded-[18px] bg-gradient-to-br from-[#3056D3] to-[#192c6d] text-white p-8 lg:p-10 text-center">
          <h2 className="text-[22px] lg:text-[28px] font-extrabold">Want a workshop for your clinic or team?</h2>
          <p className="text-white/85 mt-2 max-w-[36rem] mx-auto text-[15px]">We run private and on-site cohorts for hospitals and clinic groups. Tell us your requirement and we'll craft a curriculum.</p>
          <a href="/contact" className="inline-block mt-6 h-[46px] leading-[46px] px-7 rounded-full bg-white text-[#3056D3] text-[15px] font-bold">Contact us</a>
        </section>
      </div>

      {reg && <RegisterModal w={reg} onClose={() => setReg(null)} />}
    </div>
  );
}

function RegisterModal({ w, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", organisation: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const done = !!msg;

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!form.name.trim() || form.name.trim().length < 2) return setErr("Enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setErr("Enter a valid email.");
    setBusy(true);
    try {
      const r = await (await fetch("/api/workshops/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: w.slug, ...form }) })).json();
      if (r.ok) setMsg(r.message || "You're registered!");
      else setErr(r.error || "Could not register.");
    } catch { setErr("Network error. Try again."); }
    finally { setBusy(false); }
  }

  const field = "w-full h-[42px] px-3 rounded-[10px] border border-[#e2e5ee] text-[14px] focus:border-[#3056D3] outline-none";

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-[16px] w-full max-w-[440px] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[17px] font-extrabold text-[#0e1b4d]">Register</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[#9ca3af] text-[22px] leading-none">×</button>
        </div>
        <p className="text-[13px] text-[#6b7280] mb-4">{w.title}</p>

        {done ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-[#e6f4ee] text-[#1E7A5A] flex items-center justify-center mx-auto text-[26px]">✓</div>
            <p className="text-[14px] text-[#0e1b4d] font-semibold mt-4">{msg}</p>
            <button onClick={onClose} className="mt-5 h-[44px] px-6 rounded-full bg-[#3056D3] text-white text-[14px] font-bold">Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Full name</label>
            <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" autoFocus />
            <label className="block text-[12px] font-semibold text-[#374151] mb-1 mt-3">Email</label>
            <input className={field} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label className="block text-[12px] font-semibold text-[#374151] mb-1">Phone</label><input className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" /></div>
              <div><label className="block text-[12px] font-semibold text-[#374151] mb-1">Organisation</label><input className={field} value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} placeholder="Clinic / Hospital" /></div>
            </div>
            {err && <p className="text-[12.5px] text-[#d23f3f] font-semibold mt-3">{err}</p>}
            <button type="submit" disabled={busy} className="w-full h-[46px] mt-5 rounded-full bg-[#3056D3] text-white text-[15px] font-bold disabled:opacity-60">{busy ? "Registering…" : "Confirm registration"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
