import SiteChrome from "@/components/SiteChrome";

export const metadata = { title: "Application Under Review" };

function Content() {
  return (
    <div className="flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-[520px] bg-white rounded-[18px] border border-[rgba(31,53,128,0.12)] shadow-[0_10px_34px_rgba(14,27,77,0.10)] p-7 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#fff7e6] text-[#b7791f] flex items-center justify-center text-[26px] mb-4">⏳</div>
        <h1 className="text-[20px] font-extrabold text-[#0e1b4d]">Your application is under review</h1>
        <p className="text-[14px] text-[#6b7280] mt-2">
          Thanks for registering as a Mediconeeds seller. Our team is verifying your business and KYC documents.
          You'll receive an email with a link to set your password and access your dashboard once you're approved.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <a href="/" className="inline-flex items-center justify-center h-[44px] rounded-full bg-[#3056D3] text-white text-[15px] font-bold">Back to Home</a>
          <a href="/become-seller" className="inline-flex items-center justify-center h-[44px] rounded-full border border-[rgba(111,115,132,0.4)] text-[#0e1b4d] text-[15px] font-bold">Seller Benefits</a>
        </div>
        <p className="text-[12px] text-[#9ca3af] mt-5">Questions? Email <a href="mailto:sellers@mediconeeds.com" className="text-[#3056D3] font-semibold">sellers@mediconeeds.com</a></p>
      </div>
    </div>
  );
}

export default function Page() {
  return <SiteChrome content={<Content />} />;
}
