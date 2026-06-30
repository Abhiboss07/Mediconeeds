import SiteChrome from "@/components/SiteChrome";
export const metadata = { title: "Skin Analysis" };
export default function Page(){
  const content=(
    <div className="max-w-[640px] mx-auto px-4 py-16 text-center">
      <img src="/assets/explore/concern.webp" className="w-20 h-20 object-contain mx-auto mb-6" alt=""/>
      <p className="text-[12px] font-bold tracking-[0.15em] text-[#3056D3] uppercase mb-2">Coming Soon</p>
      <h1 className="text-[28px] font-extrabold text-[#0e1b4d]">Skin Analysis Quiz</h1>
      <p className="text-[15px] text-[#6b7280] mt-3">Answer a few quick questions and get a personalised Dr Awish routine tailored to your skin type and concerns. We're putting the finishing touches on it.</p>
      <div className="flex gap-3 justify-center mt-7">
        <a href="/products" className="bg-[#3056D3] text-white text-[14px] font-bold rounded-full px-6 py-3">Browse Products</a>
        <a href="/consultation" className="border border-[#3056D3] text-[#3056D3] text-[14px] font-bold rounded-full px-6 py-3">Talk to an Expert</a>
      </div>
    </div>);
  return <SiteChrome content={content}/>;
}
