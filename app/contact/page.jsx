import SiteChrome from "@/components/SiteChrome";
import { site } from "@/lib/site";

export const metadata = { title: "Contact Us" };

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

        {/* Right: contact form (UI only) */}
        <form className="bg-white rounded-[18px] border border-[rgba(111,115,132,0.18)] p-6 lg:p-8 space-y-4">
          <h2 className="text-[20px] font-extrabold text-[#0e1b4d] mb-2">Send us a message</h2>
          {[
            { label: "Full Name", type: "text", ph: "Your name" },
            { label: "Email", type: "email", ph: "you@example.com" },
            { label: "Phone", type: "tel", ph: "+91 ..." },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.ph}
                className="w-full h-[44px] px-4 rounded-[12px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3]"
              />
            </div>
          ))}
          <div>
            <label className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Message</label>
            <textarea
              rows={4}
              placeholder="How can we help?"
              className="w-full px-4 py-3 rounded-[12px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3]"
            />
          </div>
          <button
            type="button"
            className="w-full h-[46px] rounded-full bg-[#3056D3] text-white text-[15px] font-bold"
          >
            Send Message
          </button>
          <p className="text-[12px] text-[#9ca3af] text-center">
            We typically respond within one business day.
          </p>
        </form>
      </div>
    </div>
  );
  return <SiteChrome content={content} />;
}
