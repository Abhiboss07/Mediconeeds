import SiteChrome from "@/components/SiteChrome";
import ProductListing from "@/components/ProductListing";
import { getBestsellers } from "@/lib/catalog/store";

export const metadata = {
  title: "Best Sellers",
  description: "Shop the most-loved Dr Awish skincare — our best-selling serums, sunscreens, cleansers and combos, ranked by what customers buy most.",
};

export const dynamic = "force-dynamic"; // live catalogue from MongoDB

export default async function Page() {
  const products = await getBestsellers();
  const top = products[0];
  const content = (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-7 lg:py-10">
      <nav className="text-[12px] text-[#6b7280] mb-3">
        <a href="/" className="hover:text-[#3056D3]">Home</a> <span className="opacity-50">/</span> <span className="text-[#0e1b4d] font-semibold">Best Sellers</span>
      </nav>
      <div className="rounded-[16px] bg-gradient-to-r from-[#1F3580] to-[#3056D3] text-white p-6 lg:p-7 mb-7 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.12em] uppercase bg-white/15 rounded-full px-3 py-1 mb-2">★ Customer Favourites</div>
          <h1 className="text-[24px] lg:text-[30px] font-extrabold leading-tight">Best Sellers</h1>
          <p className="text-[14px] opacity-90 mt-1 max-w-[42ch]">The Dr Awish products our customers reorder most — proven, reviewed and loved.</p>
        </div>
        {top && (
          <a href={"/products/" + top.slug} className="hidden lg:flex items-center gap-3 bg-white/10 rounded-[14px] p-3 pr-5 hover:bg-white/15 transition-colors">
            <img src={top.image} alt={top.title} className="w-14 h-14 object-contain bg-white rounded-[10px] p-1" />
            <div>
              <div className="text-[11px] opacity-80">#1 Best Seller</div>
              <div className="text-[14px] font-bold max-w-[22ch] truncate">{top.title}</div>
            </div>
          </a>
        )}
      </div>
      <ProductListing products={products} defaultSort="bestselling" />
    </div>
  );
  return <SiteChrome content={content} />;
}
