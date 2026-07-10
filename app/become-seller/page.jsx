import SiteChrome from "@/components/SiteChrome";
import { SELLER_JOURNEY, SELLER_CATEGORIES } from "@/lib/seller/models";
import seed from "@/data/seller/seed.json";

export const metadata = {
  title: "Sell on Mediconeeds — Become a Seller",
  description: "Join Mediconeeds as a verified seller. Reach 20,000+ hospitals, clinics and buyers across India. Simple onboarding, transparent settlements and a powerful seller dashboard.",
};

const STAT_ICON = {
  buyers: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  hospital: "M3 21h18M5 21V7l7-4 7 4v14M10 12h4M12 10v4",
  clinic: "M12 3v18M3 12h18M7 7h.01M17 17h.01",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  rupee: "M6 3h12M6 8h12M9 3c4 0 6 2 6 5s-2 5-6 5H8l7 8",
  truck: "M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 19a2 2 0 100-4 2 2 0 000 4zM18.5 19a2 2 0 100-4 2 2 0 000 4z",
};
const BENEFITS = [
  { t: "Verified demand", d: "Sell to 20,000+ vetted hospitals, clinics and pharmacies — no cold outreach.", i: "M20 6L9 17l-5-5" },
  { t: "Transparent settlements", d: "Fixed payout cycles, clear commission and downloadable GST invoices.", i: "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
  { t: "Powerful seller dashboard", d: "Products, orders, inventory, analytics and earnings — all in one place.", i: "M3 3v18h18M7 15l4-4 3 3 5-6" },
  { t: "Logistics & labels", d: "Generate shipping labels, share tracking and let us handle returns.", i: "M16 3h5v5M21 3l-9 9M8 21H3v-5" },
  { t: "Growth campaigns", d: "Featured placements, seasonal sales and bundle promotions.", i: "M13 2L3 14h7l-1 8 10-12h-7z" },
  { t: "Dedicated support", d: "A partnerships team plus a help desk with tickets and chat.", i: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
];
const TRUST = ["Fortis", "Apollo", "Max Healthcare", "Medanta", "Kaya Clinic", "SkinWorks Derma"];

export default function Page() {
  const content = (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[linear-gradient(120deg,#101a44_0%,#22357e_55%,#3056D3_100%)] text-white">
        <div className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full bg-white/5" />
        <div className="absolute -left-16 bottom-0 w-[280px] h-[280px] rounded-full bg-white/5" />
        <div className="relative max-w-[84rem] mx-auto px-4 lg:px-8 py-14 lg:py-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div>
            <nav className="text-[12px] opacity-80 mb-3"><a href="/" className="hover:underline">Home</a> / <span className="font-semibold">Become a Seller</span></nav>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase bg-white/15 rounded-full px-3 py-1 mb-4">◆ Mediconeeds Seller Program</div>
            <h1 className="text-[32px] lg:text-[48px] font-extrabold leading-[1.08] max-w-[18ch]">Grow your medical &amp; skincare business across India</h1>
            <p className="text-[15px] lg:text-[18px] opacity-90 mt-4 max-w-[54ch]">List once. Reach thousands of verified hospitals, clinics and buyers. Manage products, orders, inventory and payouts from one premium seller dashboard.</p>
            <div className="flex flex-wrap gap-3 mt-7">
              <a href="/seller/register" className="inline-flex h-[50px] items-center px-7 rounded-full bg-white text-[#22357e] text-[15px] font-extrabold hover:bg-[#f0f3ff] transition-colors">Start Selling →</a>
              <a href="/seller/dashboard" className="inline-flex h-[50px] items-center px-7 rounded-full border border-white/40 text-white text-[15px] font-bold hover:bg-white/10 transition-colors">Explore Seller Dashboard</a>
            </div>
            <p className="text-[12px] opacity-75 mt-3">Free to join · No listing fees · Go live in 3–5 days</p>
          </div>
          {/* hero illustration card */}
          <div className="relative">
            <div className="rounded-[20px] bg-white/10 backdrop-blur border border-white/20 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[13px] font-bold">Seller Dashboard</div>
                <div className="text-[11px] opacity-80">This month</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[12px] bg-white/90 text-[#0e1b4d] p-3"><div className="text-[11px] text-[#6b7280] font-semibold">Revenue</div><div className="text-[20px] font-extrabold">₹3.89L</div></div>
                <div className="rounded-[12px] bg-white/90 text-[#0e1b4d] p-3"><div className="text-[11px] text-[#6b7280] font-semibold">Orders</div><div className="text-[20px] font-extrabold">271</div></div>
                <div className="rounded-[12px] bg-white/90 text-[#0e1b4d] p-3"><div className="text-[11px] text-[#6b7280] font-semibold">Active listings</div><div className="text-[20px] font-extrabold">6</div></div>
                <div className="rounded-[12px] bg-white/90 text-[#0e1b4d] p-3"><div className="text-[11px] text-[#6b7280] font-semibold">Fulfilment</div><div className="text-[20px] font-extrabold">98.2%</div></div>
              </div>
              <div className="mt-3 rounded-[12px] bg-white/90 p-3">
                <svg viewBox="0 0 100 30" className="w-full h-[54px]"><path d="M0 26 L16 20 L33 22 L50 12 L66 14 L83 6 L100 3" fill="none" stroke="#3056D3" strokeWidth="1.5"/><path d="M0 26 L16 20 L33 22 L50 12 L66 14 L83 6 L100 3 L100 30 L0 30Z" fill="rgba(48,86,211,0.12)"/></svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM STATS */}
      <section className="bg-white border-b border-[#eef0f5]">
        <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {seed.platformStats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="w-11 h-11 mx-auto rounded-[12px] bg-[rgba(48,86,211,0.08)] text-[#3056D3] flex items-center justify-center mb-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={STAT_ICON[s.icon]} /></svg>
              </div>
              <div className="text-[20px] lg:text-[24px] font-extrabold text-[#0e1b4d] leading-none">{s.value}</div>
              <div className="text-[12px] text-[#6b7280] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-12 lg:py-16">
        {/* TRUST */}
        <section className="mb-14 text-center">
          <p className="text-[12px] font-bold tracking-[0.14em] uppercase text-[#6b7280] mb-4">Trusted by leading hospitals &amp; clinics</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST.map((t) => <span key={t} className="text-[17px] lg:text-[20px] font-extrabold text-[#0e1b4d]/35">{t}</span>)}
          </div>
        </section>

        {/* WHY JOIN / BENEFITS */}
        <section className="mb-16">
          <div className="text-center max-w-[60ch] mx-auto mb-8">
            <h2 className="text-[26px] lg:text-[32px] font-extrabold text-[#0e1b4d]">Why sell on Mediconeeds?</h2>
            <p className="text-[15px] text-[#6b7280] mt-2">Everything a modern medical supplier needs to sell online — demand, tools and payouts, without the overhead.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map((b) => (
              <div key={b.t} className="rounded-[16px] border border-[rgba(111,115,132,0.16)] bg-white p-6 hover:shadow-[0_10px_30px_rgba(14,27,77,0.08)] hover:-translate-y-0.5 transition-all">
                <div className="w-12 h-12 rounded-[14px] bg-[rgba(48,86,211,0.08)] text-[#3056D3] flex items-center justify-center mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={b.i} /></svg>
                </div>
                <h3 className="text-[16px] font-bold text-[#0e1b4d]">{b.t}</h3>
                <p className="text-[13.5px] text-[#6b7280] mt-1.5 leading-relaxed">{b.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SELLER JOURNEY TIMELINE */}
        <section className="mb-16">
          <div className="text-center max-w-[60ch] mx-auto mb-10">
            <h2 className="text-[26px] lg:text-[32px] font-extrabold text-[#0e1b4d]">How selling works</h2>
            <p className="text-[15px] text-[#6b7280] mt-2">From sign-up to your first payout — nine clear steps.</p>
          </div>
          <ol className="relative max-w-[820px] mx-auto">
            <div className="absolute left-[19px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#3056D3] to-[#1E7A5A]" aria-hidden="true" />
            {SELLER_JOURNEY.map((s) => (
              <li key={s.n} className="relative flex gap-5 pb-7 last:pb-0">
                <div className="relative z-10 w-10 h-10 shrink-0 rounded-full bg-white border-2 border-[#3056D3] text-[#3056D3] font-extrabold flex items-center justify-center">{s.n}</div>
                <div className="rounded-[14px] border border-[rgba(111,115,132,0.16)] bg-white p-4 flex-1 -mt-0.5">
                  <h3 className="text-[15px] font-bold text-[#0e1b4d]">{s.t}</h3>
                  <p className="text-[13.5px] text-[#6b7280] mt-1 leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CATEGORIES */}
        <section className="mb-16">
          <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-5 text-center">Categories you can sell in</h2>
          <div className="flex flex-wrap justify-center gap-2.5">
            {SELLER_CATEGORIES.map((c) => (
              <span key={c} className="text-[13.5px] font-semibold text-[#0e1b4d] bg-white border border-[rgba(48,86,211,0.25)] rounded-full px-4 py-2">{c}</span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-[22px] bg-[linear-gradient(120deg,#101a44,#3056D3)] text-white p-8 lg:p-12 text-center">
          <h2 className="text-[26px] lg:text-[34px] font-extrabold">Ready to start selling?</h2>
          <p className="text-[15px] opacity-90 mt-2 max-w-[52ch] mx-auto">Create your seller account and submit your business details. Verification takes just 3–5 business days.</p>
          <a href="/seller/register" className="inline-flex h-[52px] items-center px-8 rounded-full bg-white text-[#22357e] text-[15px] font-extrabold mt-6 hover:bg-[#f0f3ff] transition-colors">Start Selling on Mediconeeds →</a>
        </section>
      </div>
    </div>
  );
  return <SiteChrome content={content} />;
}
