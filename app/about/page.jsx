import SiteChrome from "@/components/SiteChrome";
import { site, about, faqs } from "@/lib/site";

export const metadata = { title: "About Us" };

export default function AboutPage() {
  const content = (
    <div className="max-w-[80rem] mx-auto px-4 lg:px-8 py-8 lg:py-10">
      {/* Hero */}
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <img src={about.logo} alt="Dr Awish" className="h-10 w-auto mb-5" />
          <p className="text-[12px] font-bold tracking-[0.15em] text-[#3056D3] uppercase mb-2">{about.greeting}</p>
          <h1 className="text-[26px] lg:text-[34px] font-extrabold leading-tight text-[#0e1b4d] mb-4">
            Dermatologist-formulated skincare, made with integrity.
          </h1>
          <p className="text-[15px] leading-relaxed text-[#444]">{about.mission}</p>
          <div className="flex flex-wrap gap-2 mt-5">
            {site.trust.slice(0, 4).map((t) => (
              <span key={t} className="text-[12px] font-semibold text-[#0e1b4d] bg-[rgba(48,86,211,0.08)] rounded-full px-3 py-1.5">{t}</span>
            ))}
          </div>
        </div>
        <div className="rounded-[16px] overflow-hidden border border-[rgba(48,86,211,0.12)] shadow-[0_10px_30px_rgba(14,27,77,0.10)] max-h-[300px]">
          <img src={about.storyImage} alt="Dr Awish skincare" className="w-full h-full object-cover" style={{ maxHeight: 300 }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
        {about.stats.map((s) => (
          <div key={s.label} className="text-center bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] py-4">
            <div className="text-[24px] lg:text-[28px] font-extrabold text-[#3056D3]">{s.value}</div>
            <div className="text-[12px] text-[#6b7280] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Founder — photo ~38%, text ~62% */}
      <div className="mt-10 lg:mt-12 grid lg:grid-cols-[38%_1fr] gap-6 lg:gap-8 items-center bg-white rounded-[18px] border border-[rgba(111,115,132,0.18)] p-5 lg:p-7">
        <img
          src={about.doctor.image}
          alt={about.doctor.name}
          className="w-full object-cover rounded-[14px]"
          style={{ aspectRatio: "4 / 3", maxHeight: 320 }}
        />
        <div>
          <p className="text-[12px] font-bold tracking-[0.12em] text-[#3056D3] uppercase mb-1.5">Meet the Founder</p>
          <h2 className="text-[22px] font-extrabold text-[#0e1b4d]">{about.doctor.name}</h2>
          <p className="text-[14px] text-[#6b7280] mt-0.5">{about.doctor.title} · {about.doctor.org}</p>
          <p className="text-[14px] text-[#444] mt-3 leading-relaxed">
            {about.doctor.experience}. Dr. Awish leads a clinic and training institute dedicated to honest,
            evidence-based skincare — pairing clinical dermatology with formulations you can trust.
          </p>
          <a href="/contact" className="inline-block mt-5 text-[14px] font-bold text-white bg-[#3056D3] rounded-full px-6 py-2.5">
            Book a Skin Consultation
          </a>
        </div>
      </div>

      {/* Our Story */}
      <div className="mt-10 lg:mt-12 max-w-[58rem] mx-auto">
        <h2 className="text-[20px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-4 text-center">{about.storyTitle}</h2>
        {about.story.map((p, i) => (
          <p key={i} className="text-[14px] leading-relaxed text-[#444] mb-3">{p}</p>
        ))}
      </div>

      {/* FAQ (merged into About; /faq still available for SEO) */}
      <div className="mt-10 lg:mt-12 max-w-[52rem] mx-auto">
        <h2 className="text-[20px] lg:text-[26px] font-extrabold text-[#0e1b4d] mb-4 text-center">Frequently Asked Questions</h2>
        <div className="space-y-2.5">
          {faqs.map((f, i) => (
            <details key={i} className="group bg-white rounded-[12px] border border-[rgba(111,115,132,0.2)] p-4" open={i === 0}>
              <summary className="flex items-center justify-between cursor-pointer list-none text-[15px] font-bold text-[#0e1b4d]">
                {f.q}
                <span className="text-[#3056D3] text-[20px] leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-[14px] leading-relaxed text-[#444] mt-2.5">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="text-center mt-4"><a href="/contact" className="text-[14px] font-semibold text-[#3056D3]">Still have questions? Contact us →</a></p>
      </div>
    </div>
  );
  return <SiteChrome content={content} />;
}
