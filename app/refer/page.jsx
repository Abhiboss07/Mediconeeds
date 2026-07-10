import SiteChrome from "@/components/SiteChrome";
import ReferShare from "@/components/ReferShare";
import { site } from "@/lib/site";

export const metadata = {
  title: "Refer & Earn — Mediconeeds",
  description: "Refer friends to Mediconeeds and earn reward credits. Share your link, they get a welcome discount, you earn credit on their first order.",
  alternates: { canonical: site.seo.canonical + "/refer" },
};

const STEPS = [
  { n: 1, t: "Share your link", d: "Send your unique referral link to friends, clinics or pharmacies via WhatsApp, email or social." },
  { n: 2, t: "They get a discount", d: "Your referral gets a welcome discount on their first Mediconeeds order." },
  { n: 3, t: "You earn credit", d: "Once their first order is delivered, reward credit is added to your account wallet." },
];
const FAQS = [
  { q: "How much do I earn per referral?", a: "You earn reward credit when a referred friend completes their first delivered order. Credits apply to your future purchases." },
  { q: "Is there a limit to how many people I can refer?", a: "No — invite as many friends, clinics and pharmacies as you like. The more that order, the more you earn." },
  { q: "When is my credit added?", a: "Credit is added after your referral's first order is marked delivered, so both sides are protected against cancellations." },
  { q: "Where can I use my credit?", a: "Reward credit can be applied at checkout on any Mediconeeds order." },
];

export default function Page() {
  const content = (
    <div>
      <section className="bg-gradient-to-br from-[#1F3580] to-[#3056D3] text-white">
        <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <nav aria-label="Breadcrumb" className="text-[12px] opacity-80 mb-3"><a href="/" className="hover:underline">Home</a> <span className="opacity-60">/</span> <span className="font-semibold">Refer &amp; Earn</span></nav>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase bg-white/15 rounded-full px-3 py-1 mb-3">🎁 Refer &amp; Earn</div>
          <h1 className="text-[30px] lg:text-[44px] font-extrabold leading-[1.1] max-w-[18ch]">Give a discount, get reward credit</h1>
          <p className="text-[15px] lg:text-[17px] opacity-90 mt-4 max-w-[60ch]">Invite friends to Mediconeeds. They save on their first order of dermatologist-formulated skincare, and you earn credit when they buy.</p>
        </div>
      </section>

      <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-10 lg:py-14">
        <ReferShare />

        <section className="mt-12">
          <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-5">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-[16px] border border-[rgba(111,115,132,0.18)] bg-white p-5">
                <span className="w-9 h-9 rounded-full bg-[#3056D3] text-white text-[15px] font-bold flex items-center justify-center mb-3">{s.n}</span>
                <h3 className="text-[15px] font-bold text-[#0e1b4d]">{s.t}</h3>
                <p className="text-[13px] text-[#6b7280] mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-5">Refer &amp; Earn FAQs</h2>
          <div className="rounded-[16px] border border-[rgba(111,115,132,0.18)] divide-y divide-[#eef0f5] bg-white">
            {FAQS.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex items-center justify-between cursor-pointer list-none text-[15px] font-semibold text-[#0e1b4d]">{f.q}<span className="text-[#3056D3] text-[20px] leading-none group-open:rotate-45 transition-transform ml-4">+</span></summary>
                <p className="text-[14px] text-[#6b7280] mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
  return <SiteChrome content={content} />;
}
