import SiteChrome from "@/components/SiteChrome";
import SupplierForm from "@/components/forms/SupplierForm";
import { site } from "@/lib/site";

export const metadata = {
  title: "Become a Supplier",
  description: "Sell with Mediconeeds. Register as a Dr Awish supplier partner — fast onboarding, transparent payouts and access to a growing skincare customer base.",
};

const BENEFITS = [
  { t: "Reach more customers", d: "Get your products in front of a fast-growing skincare audience." },
  { t: "Transparent payouts", d: "Clear pricing, timely settlements and a simple dashboard." },
  { t: "Logistics support", d: "We help with fulfilment, returns and customer service." },
  { t: "Marketing reach", d: "Featured placements, campaigns and bundle opportunities." },
];
const STEPS = [
  { n: 1, t: "Register", d: "Submit your company details, GST and product categories." },
  { n: 2, t: "Verification", d: "We verify your GST, documents and product compliance." },
  { n: 3, t: "Onboard catalogue", d: "Upload your catalogue and set pricing with our team." },
  { n: 4, t: "Go live", d: "Start selling to Mediconeeds customers." },
];
const FAQS = [
  { q: "Who can become a supplier?", a: "Registered businesses (manufacturers, brands or authorised distributors) with valid GST and quality documentation." },
  { q: "What documents do I need?", a: "GST certificate and a product catalogue at minimum. Additional certifications (GMP, ISO) help speed up verification." },
  { q: "Is there a registration fee?", a: "No. Registration and verification are free; commercial terms are agreed during onboarding." },
  { q: "How long does verification take?", a: "Typically 3–5 business days once we receive complete documents." },
];

export default function Page() {
  const content = (
    <div>
      <section className="bg-gradient-to-br from-[#0e6b4f] to-[#1E7A5A] text-white">
        <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <nav className="text-[12px] opacity-80 mb-3"><a href="/" className="hover:underline">Home</a> / <span className="font-semibold">Become a Supplier</span></nav>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase bg-white/15 rounded-full px-3 py-1 mb-3">🤝 Partner with us</div>
          <h1 className="text-[30px] lg:text-[44px] font-extrabold leading-[1.1] max-w-[20ch]">Grow your skincare business with Mediconeeds</h1>
          <p className="text-[15px] lg:text-[17px] opacity-90 mt-4 max-w-[60ch]">Join our supplier network and reach more customers. Fast onboarding, transparent payouts and end-to-end logistics support.</p>
          <a href="#register" className="inline-flex h-[48px] items-center px-7 rounded-full bg-white text-[#0e6b4f] text-[15px] font-bold mt-6">Register as a supplier →</a>
        </div>
      </section>

      <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-10 lg:py-14">
        {/* benefits */}
        <section className="mb-12">
          <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-5">Why sell with us</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {BENEFITS.map((b) => (
              <div key={b.t} className="rounded-[14px] border border-[rgba(111,115,132,0.18)] bg-white p-5">
                <h3 className="text-[15px] font-bold text-[#0e1b4d]">{b.t}</h3>
                <p className="text-[13px] text-[#6b7280] mt-1.5 leading-relaxed">{b.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* how it works */}
        <section className="mb-12">
          <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-5">How onboarding works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-[14px] bg-[rgba(48,86,211,0.04)] border border-[rgba(48,86,211,0.15)] p-5">
                <div className="w-9 h-9 rounded-full bg-[#3056D3] text-white font-extrabold flex items-center justify-center mb-3">{s.n}</div>
                <h3 className="text-[15px] font-bold text-[#0e1b4d]">{s.t}</h3>
                <p className="text-[13px] text-[#6b7280] mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* registration form */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 lg:gap-10 items-start">
          <section id="register" className="rounded-[18px] border border-[rgba(31,53,128,0.12)] bg-white shadow-[0_10px_34px_rgba(14,27,77,0.06)] p-6 lg:p-8 order-2 lg:order-1">
            <h2 className="text-[20px] lg:text-[24px] font-extrabold text-[#0e1b4d]">Supplier registration</h2>
            <p className="text-[13px] text-[#6b7280] mt-1 mb-6">Tell us about your business. It takes about 3 minutes.</p>
            <SupplierForm />
          </section>
          <aside className="order-1 lg:order-2 space-y-4">
            <div className="rounded-[16px] bg-[rgba(30,122,90,0.06)] border border-[rgba(30,122,90,0.2)] p-5">
              <h3 className="text-[15px] font-bold text-[#0e1b4d] mb-3">Partnerships team</h3>
              <div className="space-y-2 text-[14px]">
                <div><span className="text-[#6b7280]">Email: </span><a href={"mailto:" + site.contact.email} className="font-semibold text-[#0e1b4d] break-all">{site.contact.email}</a></div>
                <div><span className="text-[#6b7280]">Phone: </span><a href={"tel:" + site.contact.phoneTel} className="font-semibold text-[#0e1b4d]">{site.contact.phoneDisplay}</a></div>
              </div>
            </div>
          </aside>
        </div>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-5">Supplier FAQs</h2>
          <div className="rounded-[16px] border border-[rgba(111,115,132,0.18)] divide-y divide-[#eef0f5] bg-white">
            {FAQS.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex items-center justify-between cursor-pointer list-none text-[15px] font-semibold text-[#0e1b4d]">
                  {f.q}<span className="text-[#3056D3] text-[20px] leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
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
