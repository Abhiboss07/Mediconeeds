import SiteChrome from "@/components/SiteChrome";
import ExportEnquiryForm from "@/components/forms/ExportEnquiryForm";
import { site } from "@/lib/site";

export const metadata = {
  title: "Export & International Supply",
  description: "Partner with Dr Awish for international supply of dermatologist-formulated skincare. Submit an export enquiry for wholesale, distribution and private-label opportunities worldwide.",
};

const SUPPLY = [
  { t: "Global distribution", d: "Reliable shipping to the GCC, UK, US, APAC and Africa with full export documentation." },
  { t: "Wholesale & bulk", d: "Volume pricing for distributors, pharmacies and retail chains." },
  { t: "Regulatory support", d: "COA, MSDS and compliance paperwork prepared for your market." },
  { t: "Private label", d: "White-label and co-branded skincare for established partners." },
];
const TRUST = ["Dermatologist formulated", "Cruelty-free & vegan", "GMP-compliant manufacturing", "Export-ready documentation"];
const FAQS = [
  { q: "What is the minimum order quantity for export?", a: "MOQs vary by product and destination. Share your requirements in the enquiry form and our export team will send a tailored quote." },
  { q: "Which countries do you ship to?", a: "We currently support the GCC, UK, US, Canada, Australia and parts of APAC and Africa. Select your country in the form — choose 'Other' if it isn't listed." },
  { q: "Do you provide private-label manufacturing?", a: "Yes, for established distributors. Mention private label in your message and we'll discuss MOQs and lead times." },
  { q: "How long until I get a response?", a: "Our export desk responds to qualified enquiries within 1–2 business days." },
];

export default function Page() {
  const content = (
    <div>
      {/* hero */}
      <section className="bg-gradient-to-br from-[#1F3580] to-[#3056D3] text-white">
        <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <nav className="text-[12px] opacity-80 mb-3"><a href="/" className="hover:underline">Home</a> / <span className="font-semibold">Export</span></nav>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase bg-white/15 rounded-full px-3 py-1 mb-3">🌍 International Supply</div>
          <h1 className="text-[30px] lg:text-[44px] font-extrabold leading-[1.1] max-w-[18ch]">Dr Awish skincare, supplied worldwide</h1>
          <p className="text-[15px] lg:text-[17px] opacity-90 mt-4 max-w-[60ch]">Partner with us for wholesale, distribution and private-label supply of dermatologist-formulated skincare. Tell us your market — we'll handle the rest.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <a href="#enquiry" className="inline-flex h-[48px] items-center px-7 rounded-full bg-white text-[#3056D3] text-[15px] font-bold">Start an export enquiry →</a>
            <a href="/export/how-it-works" className="inline-flex h-[48px] items-center px-7 rounded-full border border-white/60 text-white text-[15px] font-bold">How it works</a>
          </div>
        </div>
      </section>

      <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-10 lg:py-14">
        {/* supply info */}
        <section id="supply" className="mb-12">
          <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-5">International supply, end to end</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUPPLY.map((s) => (
              <div key={s.t} className="rounded-[14px] border border-[rgba(111,115,132,0.18)] bg-white p-5">
                <h3 className="text-[15px] font-bold text-[#0e1b4d]">{s.t}</h3>
                <p className="text-[13px] text-[#6b7280] mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 lg:gap-10 items-start">
          {/* enquiry form */}
          <section id="enquiry" className="rounded-[18px] border border-[rgba(31,53,128,0.12)] bg-white shadow-[0_10px_34px_rgba(14,27,77,0.06)] p-6 lg:p-8 order-2 lg:order-1">
            <h2 className="text-[20px] lg:text-[24px] font-extrabold text-[#0e1b4d]">Export enquiry</h2>
            <p className="text-[13px] text-[#6b7280] mt-1 mb-6">Includes wholesale, distribution, private-label and product requests.</p>
            <ExportEnquiryForm />
          </section>

          {/* contact + trust */}
          <aside className="order-1 lg:order-2 space-y-4">
            <div className="rounded-[16px] bg-[rgba(48,86,211,0.05)] border border-[rgba(48,86,211,0.18)] p-5">
              <h3 className="text-[15px] font-bold text-[#0e1b4d] mb-3">Export desk</h3>
              <div className="space-y-2 text-[14px]">
                <div><span className="text-[#6b7280]">Email: </span><a href={"mailto:" + site.contact.email} className="font-semibold text-[#0e1b4d] break-all">{site.contact.email}</a></div>
                <div><span className="text-[#6b7280]">Phone: </span><a href={"tel:" + site.contact.phoneTel} className="font-semibold text-[#0e1b4d]">{site.contact.phoneDisplay}</a></div>
                <div><span className="text-[#6b7280]">Hours: </span><span className="font-semibold text-[#0e1b4d]">{site.contact.hours}</span></div>
              </div>
            </div>
            <div className="rounded-[16px] border border-[rgba(111,115,132,0.18)] bg-white p-5">
              <h3 className="text-[15px] font-bold text-[#0e1b4d] mb-3">Why partners choose us</h3>
              <ul className="space-y-2">
                {TRUST.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-[13px] text-[#0e1b4d]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1E7A5A" strokeWidth="2.5"><path d="m5 13 4 4L19 7"/></svg>{t}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* FAQ */}
        <section className="mt-14">
          <h2 className="text-[22px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-5">Export FAQs</h2>
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
