import SiteChrome from "@/components/SiteChrome";
import Reveal from "@/components/Reveal";
import { site } from "@/lib/site";
import { COUNTRIES } from "@/lib/forms";

const canonical = site.seo.canonical + "/export/how-it-works";

export const metadata = {
  title: "How International Supply Works — Export Process",
  description:
    "A step-by-step guide to exporting Dr Awish dermatologist-formulated skincare: country selection, regulatory documentation, MOQs, GMP manufacturing, private label, quality assurance, international shipping, customs clearance and delivery.",
  alternates: { canonical },
  openGraph: {
    title: "How International Supply Works — Dr Awish Export Process",
    description:
      "From enquiry to delivered container: documentation, MOQs, GMP manufacturing, private label, QA, shipping and customs — explained end to end.",
    url: canonical,
    type: "article",
  },
};

// ── Icons (inline, stroke = currentColor) ──────────────────────────────────
const Icon = ({ d, className = "" }) => (
  <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d.map((p, i) => <path key={i} d={p} />)}
  </svg>
);

const TIMELINE = [
  { t: "Enquiry & scoping", d: "You share destination market, target products and volumes. Our export desk qualifies the opportunity and assigns an account manager within 1–2 business days." },
  { t: "Country selection & market fit", d: "We confirm which SKUs are cleared for your market and flag any formulation or claim adjustments needed for local compliance." },
  { t: "Regulatory & documentation", d: "We prepare the paperwork your importer and authorities require — COA, MSDS, GMP and free-sale certificates, and full ingredient disclosures." },
  { t: "MOQ & commercial terms", d: "We agree minimum order quantities, unit pricing, Incoterms and payment terms, then issue a proforma invoice for sign-off." },
  { t: "Manufacturing", d: "Your order is produced in GMP-certified facilities against a fixed batch record, with lead times confirmed up front." },
  { t: "Quality assurance", d: "Every batch is tested and released with a batch-specific Certificate of Analysis before it leaves the floor." },
  { t: "Packaging", d: "Export-grade primary and secondary packaging is applied, with market-compliant labelling, batch codes and expiry dates." },
  { t: "Branding / private label", d: "For private-label partners, approved artwork is printed and applied before final pack-out and palletisation." },
  { t: "International shipping", d: "We book air or sea freight under the agreed Incoterm, insure the consignment and share tracking from pickup to port." },
  { t: "Customs & clearance", d: "Correct HS codes and a complete document set travel with the goods so your broker can clear customs without delays." },
  { t: "Delivery & aftercare", d: "Goods arrive at your nominated address (DAP/DDP as agreed). Your account manager stays on for reorders and support." },
];

const STAGES = [
  {
    icon: ["M3 21h18", "M6 21V7l6-4 6 4v14", "M10 12h4", "M10 16h4"],
    t: "GMP manufacturing",
    d: "Formulations are produced in GMP-certified facilities under fixed batch records, so every unit in an order is identical and traceable.",
    points: ["Dermatologist-formulated, cruelty-free & vegan", "Fixed lead times confirmed before production", "Full batch traceability from raw material to pallet"],
  },
  {
    icon: ["M9 11l3 3L22 4", "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"],
    t: "Quality assurance",
    d: "Nothing ships without release. Each batch is tested for identity, microbiology and stability, and issued a batch-specific Certificate of Analysis.",
    points: ["Batch-level Certificate of Analysis (COA)", "Stability & shelf-life validated per SKU", "Retention samples held for every batch"],
  },
  {
    icon: ["M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z", "M3.3 7 12 12l8.7-5", "M12 22V12"],
    t: "Export packaging",
    d: "Primary and secondary packaging is built for long transit — moisture-resistant cartons, palletised and shrink-wrapped, with market-compliant labelling.",
    points: ["Batch codes, MRP/expiry & ingredient labels per market", "Tamper-evident, temperature-considered packing", "Cartonisation optimised for freight cost"],
  },
  {
    icon: ["M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L3.2 7.7l5.4-.8L12 2z"],
    t: "Branding & private label",
    d: "For established distributors we offer white-label and co-branded skincare — your brand, our formulations and documentation.",
    points: ["White-label or co-branded artwork", "Design support & print-ready proofs", "Separate MOQs and lead times for custom packaging"],
  },
  {
    icon: ["M3 7h13v10H3z", "M16 10h3l3 3v4h-6", "M5.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", "M18.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"],
    t: "International shipping",
    d: "We arrange air or sea freight under the Incoterm you choose, insure the consignment and provide tracking from pickup to destination port.",
    points: ["Air & sea freight; FOB / CIF / DAP / DDP", "Cargo insurance on every shipment", "End-to-end tracking & ETA updates"],
  },
  {
    icon: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M9 13h6", "M9 17h4"],
    t: "Customs & clearance",
    d: "The right HS codes and a complete, consistent document set travel with your goods, so clearance is fast and predictable in your market.",
    points: ["Correct HS classification & commercial invoice", "Certificate of Origin & packing list included", "Coordination with your customs broker"],
  },
  {
    icon: ["M20 8h-3V4H3a1 1 0 0 0-1 1v11h2", "M14 16H9", "M20 16h2v-3.34a2 2 0 0 0-.42-1.23L18.34 8H14v8", "M7.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z", "M16.5 20a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"],
    t: "Delivery & aftercare",
    d: "Goods arrive at your nominated address on the agreed terms. Your account manager stays engaged for reorders, forecasts and support.",
    points: ["Door delivery (DAP/DDP) where offered", "Reorder & forecasting support", "Single point of contact throughout"],
  },
];

const REGIONS = [
  { r: "Middle East (GCC)", c: ["United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain"] },
  { r: "UK, Europe & North America", c: ["United Kingdom", "United States", "Canada"] },
  { r: "Asia-Pacific", c: ["Australia", "Singapore", "Malaysia", "Nepal", "Bangladesh", "Sri Lanka"] },
  { r: "Africa", c: ["Nigeria", "Kenya", "South Africa"] },
];

const DOCS = [
  { t: "Certificate of Analysis (COA)", d: "Batch-specific test results — identity, assay, microbiology." },
  { t: "Material Safety Data Sheet (MSDS)", d: "Handling, storage and transport safety data per formulation." },
  { t: "GMP certificate", d: "Proof of Good Manufacturing Practice at the production site." },
  { t: "Free-sale certificate", d: "Confirms the product is legally sold in its country of origin." },
  { t: "Ingredient / INCI disclosure", d: "Full INCI list and allergen declarations for label compliance." },
  { t: "Certificate of Origin & packing list", d: "Customs-ready origin proof and itemised carton manifest." },
];

const MOQ = [
  { tier: "Stock SKUs", qty: "From 100–300 units / SKU", note: "Ready-to-ship Dr Awish range in existing packaging.", tone: "blue" },
  { tier: "Mixed container", qty: "By assortment", note: "Combine multiple SKUs to hit an efficient freight load.", tone: "indigo" },
  { tier: "Private label", qty: "Higher MOQ + lead time", note: "Custom artwork/packaging; agreed per project.", tone: "green" },
];

const FAQS = [
  { q: "How is this different from a domestic wholesale order?", a: "Export adds market-specific regulatory documentation, compliant labelling, Incoterms, freight, insurance and customs clearance. We handle all of it — you receive a landed, ready-to-sell consignment." },
  { q: "How are MOQs decided?", a: "MOQs depend on the SKU, whether it's stock or private label, and the freight mode. Stock SKUs start low; private label carries a higher MOQ because of custom packaging runs. You get exact figures on your proforma invoice." },
  { q: "Which Incoterms do you support?", a: "Commonly FOB, CIF, DAP and DDP. We'll recommend the best fit for your market and broker setup, and price accordingly." },
  { q: "How long does the whole process take?", a: "After terms are signed, typical timelines are 2–4 weeks for stock SKUs and longer for private label (driven by artwork approval and packaging production), plus transit time by freight mode." },
  { q: "Do you help with product registration in my country?", a: "We provide the manufacturer documentation your importer needs for registration. Local registration is filed by your in-market partner; we support with any additional data requested." },
  { q: "Can I request samples before committing?", a: "Yes. Note it in your enquiry and we'll arrange samples so you can assess quality and packaging before placing a bulk order." },
];

const toneMap = {
  blue: "bg-[rgba(48,86,211,0.06)] border-[rgba(48,86,211,0.22)]",
  indigo: "bg-[rgba(31,53,128,0.05)] border-[rgba(31,53,128,0.18)]",
  green: "bg-[rgba(30,122,90,0.06)] border-[rgba(30,122,90,0.22)]",
};

export default function Page() {
  const content = (
    <div>
      {/* No-JS fallback: reveal animations must never leave content hidden. */}
      <noscript><style>{".mn-reveal{opacity:1 !important;transform:none !important}"}</style></noscript>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-[#1F3580] to-[#3056D3] text-white">
        <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-12 lg:py-16">
          <nav aria-label="Breadcrumb" className="text-[12px] opacity-80 mb-3">
            <a href="/" className="hover:underline">Home</a> <span className="opacity-60">/</span>{" "}
            <a href="/export" className="hover:underline">Export</a> <span className="opacity-60">/</span>{" "}
            <span className="font-semibold">How It Works</span>
          </nav>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase bg-white/15 rounded-full px-3 py-1 mb-3">🌍 Export playbook</div>
          <h1 className="text-[30px] lg:text-[46px] font-extrabold leading-[1.1] max-w-[20ch]">How international supply works</h1>
          <p className="text-[15px] lg:text-[17px] opacity-90 mt-4 max-w-[64ch]">
            From your first enquiry to a delivered, customs-cleared consignment — here is exactly how we take Dr Awish dermatologist-formulated skincare to your market, with the documentation, quality and logistics handled end to end.
          </p>
          <div className="flex flex-wrap gap-3 mt-7">
            <a href="/export#enquiry" className="inline-flex h-[48px] items-center px-7 rounded-full bg-white text-[#3056D3] text-[15px] font-bold hover:bg-[#eef2ff] transition-colors">Start an export enquiry →</a>
            <a href="#timeline" className="inline-flex h-[48px] items-center px-7 rounded-full border border-white/60 text-white text-[15px] font-bold hover:bg-white/10 transition-colors">See the 11 steps</a>
          </div>
        </div>
      </section>

      <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-12 lg:py-16">
        {/* ── Timeline ── */}
        <section id="timeline" className="scroll-mt-24">
          <Reveal>
            <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d]">The complete export process</h2>
            <p className="text-[14px] lg:text-[15px] text-[#6b7280] mt-2 max-w-[68ch]">Eleven stages, one account manager. Each step is confirmed with you before we move to the next.</p>
          </Reveal>
          <ol className="mt-8 relative">
            <span aria-hidden className="absolute left-[19px] top-2 bottom-2 w-px bg-[rgba(48,86,211,0.22)]" />
            {TIMELINE.map((s, i) => (
              <Reveal as="li" key={s.t} delay={Math.min(i * 40, 240)} className="relative flex gap-4 pb-7 last:pb-0">
                <span className="relative z-10 shrink-0 w-10 h-10 rounded-full bg-[#3056D3] text-white text-[15px] font-bold flex items-center justify-center shadow-[0_4px_12px_rgba(48,86,211,0.35)]">{i + 1}</span>
                <div className="pt-1">
                  <h3 className="text-[16px] font-bold text-[#0e1b4d]">{s.t}</h3>
                  <p className="text-[13.5px] text-[#6b7280] mt-1 leading-relaxed max-w-[70ch]">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ── Country selection ── */}
        <section id="countries" className="mt-16 scroll-mt-24">
          <Reveal>
            <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d]">Country selection & market fit</h2>
            <p className="text-[14px] lg:text-[15px] text-[#6b7280] mt-2 max-w-[68ch]">We supply across four regions and confirm which SKUs are cleared for your market before anything is produced. If your country isn't listed, ask — we regularly open new lanes.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-4 mt-7">
            {REGIONS.map((rg, i) => (
              <Reveal key={rg.r} delay={i * 60} className="rounded-[16px] border border-[rgba(111,115,132,0.18)] bg-white p-5">
                <h3 className="text-[15px] font-bold text-[#0e1b4d] mb-3">{rg.r}</h3>
                <div className="flex flex-wrap gap-2">
                  {rg.c.map((c) => (
                    <span key={c} className="text-[12.5px] font-medium bg-[#f5f6fb] text-[#0e1b4d] rounded-full px-3 py-1.5">{c}</span>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
          <p className="text-[13px] text-[#6b7280] mt-4">Supported destinations include {COUNTRIES.slice(0, 6).join(", ")} and more — select yours (or “Other”) in the enquiry form.</p>
        </section>

        {/* ── Regulatory documentation ── */}
        <section id="documentation" className="mt-16 scroll-mt-24">
          <Reveal>
            <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d]">Regulatory & documentation</h2>
            <p className="text-[14px] lg:text-[15px] text-[#6b7280] mt-2 max-w-[68ch]">Your importer and local authorities need a consistent paper trail. We prepare it for every consignment so registration and clearance go smoothly.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-7">
            {DOCS.map((d, i) => (
              <Reveal key={d.t} delay={i * 50} className="rounded-[14px] border border-[rgba(111,115,132,0.18)] bg-white p-5">
                <div className="w-9 h-9 rounded-[10px] bg-[rgba(48,86,211,0.08)] text-[#3056D3] flex items-center justify-center mb-3">
                  <Icon d={["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6"]} />
                </div>
                <h3 className="text-[14.5px] font-bold text-[#0e1b4d]">{d.t}</h3>
                <p className="text-[13px] text-[#6b7280] mt-1.5 leading-relaxed">{d.d}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── MOQ ── */}
        <section id="moq" className="mt-16 scroll-mt-24">
          <Reveal>
            <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d]">MOQ requirements</h2>
            <p className="text-[14px] lg:text-[15px] text-[#6b7280] mt-2 max-w-[68ch]">Minimum order quantities depend on the SKU, whether it's stock or private label, and your freight mode. Exact figures are confirmed on your proforma invoice.</p>
          </Reveal>
          <div className="grid sm:grid-cols-3 gap-4 mt-7">
            {MOQ.map((m, i) => (
              <Reveal key={m.tier} delay={i * 70} className={`rounded-[16px] border p-5 ${toneMap[m.tone]}`}>
                <h3 className="text-[15px] font-bold text-[#0e1b4d]">{m.tier}</h3>
                <div className="text-[18px] font-extrabold text-[#0e1b4d] mt-2">{m.qty}</div>
                <p className="text-[13px] text-[#6b7280] mt-1.5 leading-relaxed">{m.note}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Production, packaging, branding, QA, shipping, customs, delivery ── */}
        <section id="stages" className="mt-16 scroll-mt-24">
          <Reveal>
            <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d]">Manufacturing, packaging & logistics</h2>
            <p className="text-[14px] lg:text-[15px] text-[#6b7280] mt-2 max-w-[68ch]">How your order is made, checked, packed, branded and moved — with quality and traceability at every stage.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
            {STAGES.map((s, i) => (
              <Reveal key={s.t} delay={(i % 3) * 60} className="rounded-[16px] border border-[rgba(111,115,132,0.18)] bg-white p-6 hover:shadow-[0_10px_30px_rgba(14,27,77,0.08)] transition-shadow">
                <div className="w-11 h-11 rounded-[12px] bg-[rgba(48,86,211,0.08)] text-[#3056D3] flex items-center justify-center mb-4">
                  <Icon d={s.icon} />
                </div>
                <h3 className="text-[16px] font-bold text-[#0e1b4d]">{s.t}</h3>
                <p className="text-[13px] text-[#6b7280] mt-2 leading-relaxed">{s.d}</p>
                <ul className="mt-3 space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[12.5px] text-[#374151]">
                      <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1E7A5A" strokeWidth="2.6"><path d="m5 13 4 4L19 7" /></svg>
                      {p}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="mt-16 scroll-mt-24">
          <Reveal>
            <h2 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d] mb-5">Export process FAQs</h2>
          </Reveal>
          <Reveal className="rounded-[16px] border border-[rgba(111,115,132,0.18)] divide-y divide-[#eef0f5] bg-white">
            {FAQS.map((f) => (
              <details key={f.q} className="group p-5">
                <summary className="flex items-center justify-between cursor-pointer list-none text-[15px] font-semibold text-[#0e1b4d]">
                  {f.q}<span className="text-[#3056D3] text-[20px] leading-none group-open:rotate-45 transition-transform shrink-0 ml-4">+</span>
                </summary>
                <p className="text-[14px] text-[#6b7280] mt-2 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </Reveal>
        </section>
      </div>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-br from-[#1F3580] to-[#3056D3] text-white">
        <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-12 lg:py-16 text-center">
          <Reveal>
            <h2 className="text-[24px] lg:text-[32px] font-extrabold leading-tight">Ready to supply your market?</h2>
            <p className="text-[15px] opacity-90 mt-3 max-w-[56ch] mx-auto">Tell our export team your destination, products and volumes. We'll send a tailored quote within 1–2 business days.</p>
            <div className="flex flex-wrap gap-3 justify-center mt-7">
              <a href="/export#enquiry" className="inline-flex h-[50px] items-center px-8 rounded-full bg-white text-[#3056D3] text-[15px] font-bold hover:bg-[#eef2ff] transition-colors">Start an export enquiry →</a>
              <a href={"mailto:" + site.contact.email} className="inline-flex h-[50px] items-center px-8 rounded-full border border-white/60 text-white text-[15px] font-bold hover:bg-white/10 transition-colors">Email the export desk</a>
            </div>
            <p className="text-[13px] opacity-80 mt-5">
              {site.contact.email} · <a href={"tel:" + site.contact.phoneTel} className="underline">{site.contact.phoneDisplay}</a> · {site.contact.hours}
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
  return <SiteChrome content={content} />;
}
