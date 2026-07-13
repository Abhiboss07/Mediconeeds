import { Fragment } from "react";
import Frag from "@/components/Frag";
import Interactions from "@/components/Interactions";
import AddressPortal from "@/components/AddressPortal";
import MegaMenu from "@/components/MegaMenu";
import SearchOverlay from "@/components/SearchOverlay";
import ShopByCategory from "@/components/ShopByCategory";
import ShopByIngredient from "@/components/ShopByIngredient";
import ProductRail from "@/components/ProductRail";
import { loadManifest, loadHtml, makeProductLinker } from "@/lib/fragments";
import { getStorefrontProducts, getCategoryCounts, getIngredientCounts, getNewArrivals } from "@/lib/catalog/store";
import ingredientTaxonomy from "@/data/catalog/ingredients.json";

// Every original homepage SECTION is preserved, but each is now driven by the
// live database instead of static/mock content — count grids show real counts
// (0 allowed for ingredients), product carousels show real products with a
// graceful zero-state. Nothing is hardcoded and no section is removed.
const RAILS = {
  // desktop section name → { title, source, href }
  "sec-02-dental-instruments-consu": { title: "Our Bestsellers", src: "best" },
  "sec-03-lab-bestsellers-view-all": { title: "New Launches", src: "new" },
  "sec-05-premium-diagnostics-ot-h": { title: "Serums", src: "cat:Serums", href: "/products?category=Serums" },
  "sec-06-top-selling-consumables-": { title: "Deals & Offers", src: "offers", href: "/products?offers=1" },
  "sec-07-dental-equipment-zone-vi": { title: "Sunscreens", src: "cat:Sunscreens", href: "/products?category=Sunscreens" },
  "sec-08-diagnostic-precision-pro": { title: "Combos & Kits", src: "cat:Combos & Kits", href: "/products?category=Combos+%26+Kits" },
  "sec-09-top-selling-critical-car": { title: "Recommended for You", src: "best" },
  "refurbished": { title: "Curated Skincare Ranges", src: "all" },
  // mobile equivalents
  "m-dental": { title: "Our Bestsellers", src: "best" },
  "m-lab": { title: "New Launches", src: "new" },
  "m-premium": { title: "Serums", src: "cat:Serums", href: "/products?category=Serums" },
  "m-consumables": { title: "Deals & Offers", src: "offers", href: "/products?offers=1" },
  "m-dental-equip": { title: "Sunscreens", src: "cat:Sunscreens", href: "/products?category=Sunscreens" },
  "m-promo": { title: "Combos & Kits", src: "cat:Combos & Kits", href: "/products?category=Combos+%26+Kits" },
  "m-critical": { title: "Recommended for You", src: "best" },
};

// ISR: served from cache (fast TTFB) but regenerated every 60s, so a newly
// approved category/product appears — and an emptied category disappears —
// automatically within a minute, with no redeploy or code change.
export const revalidate = 60;

export default async function Home() {
  // Counts come from Mongo aggregation (no full scan); the product list is
  // fetched once and the rails are derived from it in-memory (no redundant
  // queries). The fragments' stub product links are rewritten to real handles.
  const [products, categoryCounts, ingredientCounts, newArrivals] = await Promise.all([
    getStorefrontProducts().catch(() => []),
    getCategoryCounts().catch(() => []),
    getIngredientCounts(ingredientTaxonomy.map((i) => i.name)).catch(() => []),
    getNewArrivals(12).catch(() => []),
  ]);
  const bestsellers = [...products].sort((a, b) => (b.reviews * b.rating - a.reviews * a.rating) || (b.stock - a.stock));
  const offers = products.filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount);
  const linkify = makeProductLinker(products.map((p) => p.handle || p.slug));

  const byCat = (name) => products.filter((p) => (p.categoryName || p.category) === name);
  const railItems = (src) =>
    src === "best" ? bestsellers : src === "new" ? newArrivals : src === "offers" ? offers
      : src === "all" ? products : src.startsWith("cat:") ? byCat(src.slice(4)) : [];

  // Render one homepage section: DB-driven grid/rail where we have a real
  // component, otherwise the original static fragment (banner, trust-strip,
  // testimonials, explore chips…). A section is never dropped.
  const renderSection = (name, mobile) => {
    if (name === "shop-by-category") return <ShopByCategory key={name} categories={categoryCounts} variant={mobile ? "mobile" : "desktop"} />;
    if (name === "top-brands") return <ShopByIngredient key={name} ingredients={ingredientCounts} variant={mobile ? "mobile" : "desktop"} />;
    const rail = RAILS[name];
    if (rail) {
      const inner = <ProductRail title={rail.title} products={railItems(rail.src)} viewAllHref={rail.href || "/products"} keepWhenEmpty />;
      return mobile ? <div key={name} className="px-4 py-3">{inner}</div> : <Fragment key={name}>{inner}</Fragment>;
    }
    const s = mobile ? { item: mm.items[name], html: linkify(loadHtml(name, "mobile")) } : { item: dm.items[name], html: linkify(loadHtml(name, "sections")) };
    return <Frag key={(mobile ? "m-" : "") + name} item={s.item} html={s.html} />;
  };

  // ---- Desktop tree (>= lg) ----
  const dm = loadManifest("sections");
  const d = (name) => ({ item: dm.items[name], html: linkify(loadHtml(name, "sections")) });
  const dHeader = d("header");
  const dBanner = d("banner");
  const dSidebar = d("sidebar");
  const dFooter = d("footer");

  // ---- Mobile tree (< lg) ----
  const mm = loadManifest("mobile");
  const mFooter = { item: mm.items["footer"], html: linkify(loadHtml("footer", "mobile")) };
  const mInside = mm.order.filter((n) => n !== "footer");

  return (
    <div className="__className_5f1e15 block">
      {/* ===================== DESKTOP ===================== */}
      <div className="hidden lg:block">
        <div className="bg-[#F7FAFF] ">
          <Frag item={dHeader.item} html={dHeader.html} />
          <div className="relative">
            <div className="flex flex-col items-center w-full px-0  mx-auto max-w-[84rem] ">
              <Frag item={dBanner.item} html={dBanner.html} />
            </div>
          </div>
          <div className={dm.content_class + " mc-content"}>
            <Frag item={dSidebar.item} html={dSidebar.html} className="mc-sidebar" />
            <div className={dm.rightcol_class}>
              {dm.sections.map((name) => renderSection(name, false))}
            </div>
          </div>
        </div>
        <Frag item={dFooter.item} html={dFooter.html} />
        <MegaMenu />
      </div>

      {/* ===================== MOBILE ===================== */}
      <div className="lg:hidden">
        <div className="bg-[#F7FAFF] overflow-x-clip">
          {mInside.map((name) => renderSection(name, true))}
        </div>
        <Frag item={mFooter.item} html={mFooter.html} />
      </div>

      {/* Client behaviour for both trees */}
      <Interactions />
      <AddressPortal />
      <SearchOverlay />
    </div>
  );
}
