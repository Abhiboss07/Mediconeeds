import SiteChrome from "@/components/SiteChrome";
import { site } from "@/lib/site";
export const metadata = { title: "Skin Consultation" };
export default function Page(){
  const content=(
    <div className="max-w-[640px] mx-auto px-4 py-16 text-center">
      <div className="w-20 h-20 rounded-full bg-[rgba(30,122,90,0.12)] flex items-center justify-center mx-auto mb-6"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#1E7A5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3a8.38 8.38 0 0 1 8.5 8.5z"/><path d="M12 8v6M9 11h6"/></svg></div>
      <p className="text-[12px] font-bold tracking-[0.15em] text-[#3056D3] uppercase mb-2">Dr Awish Clinic</p>
      <h1 className="text-[28px] font-extrabold text-[#0e1b4d]">Book a Skin Consultation</h1>
      <p className="text-[15px] text-[#6b7280] mt-3">Online dermatologist consultations with the Dr Awish clinic are launching shortly. In the meantime, reach us directly and our team will help you build the right routine.</p>
      <div className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-5 mt-7 text-left text-[14px] inline-block">
        <div className="py-1"><span className="text-[#6b7280]">Phone: </span><a href={"tel:"+site.contact.phoneTel} className="font-semibold text-[#0e1b4d]">{site.contact.phoneDisplay}</a></div>
        <div className="py-1"><span className="text-[#6b7280]">Email: </span><a href={"mailto:"+site.contact.email} className="font-semibold text-[#0e1b4d]">{site.contact.email}</a></div>
        <div className="py-1"><span className="text-[#6b7280]">Hours: </span><span className="font-semibold text-[#0e1b4d]">{site.contact.hours}</span></div>
      </div>
      <div className="mt-7"><a href={"https://wa.me/"+site.contact.whatsapp} className="bg-[#25D366] text-white text-[14px] font-bold rounded-full px-6 py-3">Chat on WhatsApp</a></div>
    </div>);
  return <SiteChrome content={content}/>;
}
