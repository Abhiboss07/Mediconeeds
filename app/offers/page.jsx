import SiteChrome from "@/components/SiteChrome";
import ProductListing from "@/components/ProductListing";
import { getOffers } from "@/lib/catalog/store";

export const metadata = {
  title: "Offers & Deals",
  description: "Live Dr Awish skincare offers — clearance deals, flash discounts and bundle savings across serums, sunscreens, cleansers and combos.",
};

export const dynamic = "force-dynamic"; // live catalogue from MongoDB

export default async function Page() {
  const products = await getOffers();
  const maxDisc = products.reduce((m, p) => Math.max(m, p.discount || 0), 0);
  const deals = [
    { t: "Clearance Sale", d: `Up to ${maxDisc}% off`, sub: "Limited stock, lowest prices", cls: "from-[#e0633a] to-[#c64a22]" },
    { t: "Flash Offers", d: "Today only", sub: "New deals refreshed daily", cls: "from-[#3056D3] to-[#1F3580]" },
    { t: "Bundle & Save", d: "Combos & Kits", sub: "Routine bundles at combo prices", cls: "from-[#1E7A5A] to-[#0e6b4f]" },
  ];
  const content = (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-7 lg:py-10">
      <nav className="text-[12px] text-[#6b7280] mb-3">
        <a href="/" className="hover:text-[#3056D3]">Home</a> <span className="opacity-50">/</span> <span className="text-[#0e1b4d] font-semibold">Offers</span>
      </nav>
      <h1 className="text-[24px] lg:text-[32px] font-extrabold text-[#0e1b4d]">Offers &amp; Deals</h1>
      <p className="text-[14px] text-[#6b7280] mt-1 mb-6">Every active Dr Awish discount in one place.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {deals.map((b) => (
          <div key={b.t} className={`rounded-[16px] bg-gradient-to-r ${b.cls} text-white p-5`}>
            <div className="text-[12px] font-bold tracking-[0.1em] uppercase opacity-90">{b.t}</div>
            <div className="text-[26px] font-extrabold leading-tight mt-1">{b.d}</div>
            <div className="text-[13px] opacity-90 mt-1">{b.sub}</div>
          </div>
        ))}
      </div>

      <ProductListing products={products} defaultSort="discount" offersOnly />
    </div>
  );
  return <SiteChrome content={content} />;
}
