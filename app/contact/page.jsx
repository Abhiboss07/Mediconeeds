import SiteChrome from "@/components/SiteChrome";
import ContactForm from "@/components/forms/ContactForm";
import { site } from "@/lib/site";

export default function ContactPage() {
  const c = site.contact;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(c.mapQuery)}&output=embed`;

  const content = (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <h1 className="text-[28px] lg:text-[36px] font-extrabold text-[#0e1b4d]">Get in touch</h1>
      <p className="text-[15px] text-[#6b7280] mt-2 mb-8">
        Questions about your skin or an order? Our team and skin experts are here to help.
      </p>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: details + map */}
        <div>
          <div className="space-y-5">
            <div>
              <p className="text-[13px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-1">Address</p>
              <p className="text-[15px] text-[#0e1b4d]">{c.addressLines.join(" ")}</p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-[13px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-1">Phone</p>
                <a href={`tel:${c.phoneTel}`} className="text-[15px] text-[#0e1b4d]">{c.phoneDisplay}</a>
              </div>
              <div>
                <p className="text-[13px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-1">Email</p>
                <a href={`mailto:${c.email}`} className="text-[15px] text-[#0e1b4d]">{c.email}</a>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-1">Clinic Hours</p>
              <p className="text-[15px] text-[#0e1b4d]">{c.hours}</p>
            </div>
            <a
              href={`https://wa.me/${c.whatsapp}`}
              className="inline-flex items-center gap-2 text-[14px] font-bold text-white bg-[#25D366] rounded-full px-6 py-3"
            >
              Chat on WhatsApp
            </a>
          </div>
          <div className="mt-7 rounded-[16px] overflow-hidden border border-[rgba(111,115,132,0.2)] h-[280px]">
            <iframe
              title="Mediconeeds location"
              src={mapSrc}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
        </div>

        {/* Right: contact form */}
        <ContactForm />
      </div>
    </div>
  );
  return <SiteChrome content={content} />;
}
