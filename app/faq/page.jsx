import SiteChrome from "@/components/SiteChrome";
import { faqs } from "@/lib/site";

export const metadata = { title: "FAQ" };

export default function FaqPage() {
  const content = (
    <div className="max-w-[52rem] mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <h1 className="text-[28px] lg:text-[36px] font-extrabold text-[#0e1b4d] text-center">
        Frequently Asked Questions
      </h1>
      <p className="text-[15px] text-[#6b7280] mt-2 mb-8 text-center">
        Everything you need to know about Dr Awish and our skincare philosophy.
      </p>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <details
            key={i}
            className="group bg-white rounded-[14px] border border-[rgba(111,115,132,0.2)] p-5"
            open={i === 0}
          >
            <summary className="flex items-center justify-between cursor-pointer list-none text-[16px] font-bold text-[#0e1b4d]">
              {f.q}
              <span className="text-[#3056D3] text-[22px] leading-none group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-[14px] leading-relaxed text-[#444] mt-3">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
  return <SiteChrome content={content} />;
}
