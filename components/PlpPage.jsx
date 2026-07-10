import SiteChrome from "@/components/SiteChrome";
import ProductListing from "@/components/ProductListing";
import { getStorefrontProducts } from "@/lib/catalog/store";

// Shop / Product Listing page — a fully functional, data-driven catalogue with
// working sort, multi-facet filters (category, ingredient, product type, price,
// rating, offers, availability), URL-synced state and pagination.
// Products are queried LIVE from MongoDB (CatalogProduct) at request time.
export default async function PlpPage() {
  const products = await getStorefrontProducts();
  const content = (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-6 lg:py-9">
      <nav className="text-[12px] text-[#6b7280] mb-3">
        <a href="/" className="hover:text-[#3056D3]">Home</a> <span className="opacity-50">/</span> <span className="text-[#0e1b4d] font-semibold">Shop</span>
      </nav>
      <h1 className="text-[22px] lg:text-[30px] font-extrabold text-[#0e1b4d]">Shop All Skincare</h1>
      <p className="text-[14px] text-[#6b7280] mt-1 mb-6">The full Dr Awish range — filter and sort to find your perfect routine.</p>
      <ProductListing products={products} defaultSort="featured" />
    </div>
  );
  return <SiteChrome content={content} />;
}
