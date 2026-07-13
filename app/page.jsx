import { Fragment } from "react";
import Frag from "@/components/Frag";
import Interactions from "@/components/Interactions";
import AddressPortal from "@/components/AddressPortal";
import MegaMenu from "@/components/MegaMenu";
import SearchOverlay from "@/components/SearchOverlay";
import ShopByCategory from "@/components/ShopByCategory";
import ProductRail from "@/components/ProductRail";
import { loadManifest, loadHtml, makeProductLinker } from "@/lib/fragments";
import { getStorefrontProducts, getCategoryCounts, getBestsellers } from "@/lib/catalog/store";

// Static clone carousels that showed MOCK product cards (names/prices/ratings not
// in the real catalogue) — hidden so the home shows only real products. The real
// range is surfaced by <ProductRail> instead.
const HIDE_SECTIONS = new Set([
  "sec-02-dental-instruments-consu", "sec-03-lab-bestsellers-view-all",
  "sec-05-premium-diagnostics-ot-h", "sec-06-top-selling-consumables-",
  "sec-07-dental-equipment-zone-vi", "sec-08-diagnostic-precision-pro",
  "sec-09-top-selling-critical-car", "refurbished",
  // "Shop by Ingredient" showed hardcoded fake counts (e.g. "42 Products");
  // real ingredient data is too sparse to be meaningful, so the section hides.
  "top-brands",
  "m-dental", "m-lab", "m-premium", "m-consumables", "m-dental-equip", "m-promo", "m-critical",
]);

// ISR: render the (mostly static) home at build/first-hit and refresh every 5
// min, so TTFB is served from cache instead of re-running SSR + a DB query on
// every request. The catalogue-handle rewrite stays fresh within the window.
export const revalidate = 300;

export default async function Home() {
  // Rewrite the static fragments' stub product links to real, live catalogue
  // handles so every product card opens a valid PDP (see makeProductLinker).
  const products = await getStorefrontProducts().catch(() => []);
  const linkify = makeProductLinker(products.map((p) => p.handle || p.slug));

  // Real, database-driven category counts — replaces the static grid whose
  // counts were hardcoded and linked to categories with no products.
  const categoryCounts = await getCategoryCounts().catch(() => []);
  const bestsellers = await getBestsellers().catch(() => []);

  // ---- Desktop tree (>= lg) ----
  const dm = loadManifest("sections");
  const d = (name) => ({ item: dm.items[name], html: linkify(loadHtml(name, "sections")) });
  const dHeader = d("header");
  const dBanner = d("banner");
  const dSidebar = d("sidebar");
  const dFooter = d("footer");

  // ---- Mobile tree (< lg) ----
  const mm = loadManifest("mobile");
  const m = (name) => ({ item: mm.items[name], html: linkify(loadHtml(name, "mobile")) });
  const mFooter = m("footer");
  const mInside = mm.order.filter((n) => n !== "footer"); // header..bottom-nav

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
              {dm.sections.map((name) => {
                // Real DB-driven category grid + real product rail instead of the
                // static fake-count grid and mock carousels.
                if (name === "shop-by-category") return (
                  <Fragment key={name}>
                    <ShopByCategory categories={categoryCounts} />
                    <ProductRail title="Our Products" products={bestsellers} />
                  </Fragment>
                );
                if (HIDE_SECTIONS.has(name)) return null;
                const s = d(name);
                return <Frag key={name} item={s.item} html={s.html} />;
              })}
            </div>
          </div>
        </div>
        <Frag item={dFooter.item} html={dFooter.html} />
        <MegaMenu />
      </div>

      {/* ===================== MOBILE ===================== */}
      <div className="lg:hidden">
        <div className="bg-[#F7FAFF] overflow-x-clip">
          {mInside.map((name) => {
            if (name === "shop-by-category") return (
              <Fragment key={"m-" + name}>
                <ShopByCategory categories={categoryCounts} variant="mobile" />
                <div className="px-4 py-3"><ProductRail title="Our Products" products={bestsellers} /></div>
              </Fragment>
            );
            if (HIDE_SECTIONS.has(name)) return null;
            const s = m(name);
            return <Frag key={"m-" + name} item={s.item} html={s.html} />;
          })}
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
