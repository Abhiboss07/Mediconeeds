import { Fragment } from "react";
import Frag from "@/components/Frag";
import Interactions from "@/components/Interactions";
import AddressPortal from "@/components/AddressPortal";
import MegaMenu from "@/components/MegaMenu";
import SearchOverlay from "@/components/SearchOverlay";
import MobileFooter from "@/components/mobile/MobileFooter";
import ShopByCategory from "@/components/ShopByCategory";
import ShopByIngredient from "@/components/ShopByIngredient";
import ProductRail from "@/components/ProductRail";
import { loadManifest, loadHtml, makeProductLinker } from "@/lib/fragments";
import { getStorefrontProducts, getHomeCategoryCounts, getIngredientCounts, getNewArrivals } from "@/lib/catalog/store";
import ingredientTaxonomy from "@/data/catalog/ingredients.json";
import { site } from "@/lib/site";

// Homepage structured data (QA finding L-2). Organization gives Google the brand
// identity + logo + verified social profiles (sameAs); WebSite + SearchAction
// enables the sitelinks search box. Product schema lives on the PDP separately.
const homeJsonLd = (() => {
  const base = site.seo.canonical.replace(/\/$/, "");
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.brand.name,
      url: base,
      logo: `${base}/icon.svg`,
      sameAs: [site.social.instagram, site.social.facebook, site.social.youtube].filter(Boolean),
      contactPoint: {
        "@type": "ContactPoint",
        telephone: site.contact.phoneDisplay,
        email: site.contact.email,
        contactType: "customer service",
        areaServed: "IN",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.brand.name,
      url: base,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${base}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
})();

// Homepage section slots → the reference section title + which REAL products it
// shows. Each source is a genuine filter (tags/category/discount), never padded
// or duplicated to fake volume; an empty result renders a "Coming Soon" state.
const RAILS = {
  "sec-02-dental-instruments-consu": { title: "Our Bestsellers", src: "best" },
  "sec-03-lab-bestsellers-view-all": { title: "New Launches", src: "new" },
  "sec-05-premium-diagnostics-ot-h": { title: "Summer Essentials", src: "summer" },
  "sec-06-top-selling-consumables-": { title: "Lightning Deal", src: "lightning" },
  "sec-07-dental-equipment-zone-vi": { title: "Best-Value Kits & Combos", src: "kits" },
  "sec-08-diagnostic-precision-pro": { title: "Target Acne & Pigmentation", src: "acne" },
  "sec-09-top-selling-critical-car": { title: "Anti-Ageing Heroes", src: "antiage" },
  "m-dental": { title: "Our Bestsellers", src: "best" },
  "m-lab": { title: "New Launches", src: "new" },
  "m-premium": { title: "Summer Essentials", src: "summer" },
  "m-consumables": { title: "Lightning Deal", src: "lightning" },
  "m-dental-equip": { title: "Best-Value Kits & Combos", src: "kits" },
  "m-promo": { title: "Target Acne & Pigmentation", src: "acne" },
  "m-critical": { title: "Anti-Ageing Heroes", src: "antiage" },
};

// ISR: served from cache (fast TTFB) but regenerated every 60s, so a newly
// approved category/product appears — and an emptied category disappears —
// automatically within a minute, with no redeploy or code change.
export const revalidate = 60;

export default async function Home() {
  // Counts come from Mongo aggregation (no full scan); the product list is
  // fetched once and every section is derived from it in-memory by a REAL filter
  // (no duplication, no mock). Category grid shows the full taxonomy with live
  // counts or "Coming Soon".
  const [products, categories, ingredientCounts, newArrivals] = await Promise.all([
    getStorefrontProducts().catch(() => []),
    getHomeCategoryCounts().catch(() => []),
    getIngredientCounts(ingredientTaxonomy.map((i) => i.name)).catch(() => []),
    getNewArrivals(12).catch(() => []),
  ]);
  const linkify = makeProductLinker(products.map((p) => p.handle || p.slug));

  const hasTag = (p, ...t) => (p.tags || []).some((x) => t.includes(String(x).toLowerCase()));
  const foldKey = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");
  const inCat = (p, name) => foldKey(p.categoryName || p.category) === foldKey(name);
  const SECTIONS = {
    best: [...products].sort((a, b) => (b.reviews * b.rating - a.reviews * a.rating) || (b.stock - a.stock)),
    new: newArrivals,
    summer: products.filter((p) => hasTag(p, "sunscreen", "spf") || inCat(p, "Sunscreen")),
    lightning: products.filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount),
    kits: products.filter((p) => hasTag(p, "combo", "kit") || inCat(p, "Combos & Kits")),
    acne: products.filter((p) => hasTag(p, "acne", "pigmentation")),
    antiage: products.filter((p) => hasTag(p, "anti-ageing", "antiageing", "retinol", "night")),
  };
  const railItems = (src) => SECTIONS[src] || [];

  // Render one homepage section: DB-driven grid/rail where we have a real
  // component, otherwise the original static fragment (banner, trust-strip,
  // testimonials, explore chips…). A section is never dropped.
  const renderSection = (name, mobile) => {
    if (name === "shop-by-category") return <ShopByCategory key={name} categories={categories} variant={mobile ? "mobile" : "desktop"} />;
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
  const mInside = mm.order.filter((n) => n !== "footer");

  return (
    <div className="__className_5f1e15 block">
      {/* SEO structured data (Organization + WebSite/SearchAction) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }} />
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
        <MobileFooter />
      </div>

      {/* Client behaviour for both trees */}
      <Interactions />
      <AddressPortal />
      <SearchOverlay />
    </div>
  );
}
