import SiteChrome from "@/components/SiteChrome";
import RegisterWizard from "@/components/seller/RegisterWizard";
import { SELLER_JOURNEY } from "@/lib/seller/models";

export const metadata = {
  title: "Seller Registration — Mediconeeds",
  description: "Create your Mediconeeds seller account. Complete business, bank and document details to start selling to verified buyers across India.",
};

export default function Page() {
  const content = (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <nav className="text-[12px] text-[#6b7280] mb-3"><a href="/" className="hover:text-[#3056D3]">Home</a> / <a href="/become-seller" className="hover:text-[#3056D3]">Become a Seller</a> / <span className="text-[#0e1b4d] font-semibold">Register</span></nav>
      <h1 className="text-[26px] lg:text-[34px] font-extrabold text-[#0e1b4d]">Create your seller account</h1>
      <p className="text-[14px] text-[#6b7280] mt-1 mb-8">Complete the steps below. It takes about 5 minutes — you can review everything before submitting.</p>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
        <section className="min-w-0 rounded-[18px] border border-[rgba(31,53,128,0.12)] bg-white shadow-[0_10px_34px_rgba(14,27,77,0.06)] p-6 lg:p-8">
          <RegisterWizard />
        </section>
        <aside className="min-w-0 space-y-4">
          <div className="rounded-[16px] bg-[rgba(48,86,211,0.05)] border border-[rgba(48,86,211,0.18)] p-5">
            <h3 className="text-[14px] font-extrabold text-[#0e1b4d] mb-3">What happens next</h3>
            <ol className="space-y-2.5">
              {SELLER_JOURNEY.slice(3, 7).map((s) => (
                <li key={s.n} className="flex gap-2.5 text-[13px]">
                  <span className="w-5 h-5 shrink-0 rounded-full bg-[#3056D3] text-white text-[11px] font-bold flex items-center justify-center">{s.n}</span>
                  <span className="text-[#374151]">{s.t}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[16px] bg-[rgba(30,122,90,0.06)] border border-[rgba(30,122,90,0.2)] p-5 text-[13px]">
            <h3 className="text-[14px] font-extrabold text-[#0e1b4d] mb-2">Keep these ready</h3>
            <ul className="list-disc list-inside space-y-1 text-[#374151]">
              <li>GSTIN &amp; PAN</li>
              <li>Bank account &amp; IFSC</li>
              <li>GST certificate, PAN, cheque</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
  return <SiteChrome content={content} />;
}
