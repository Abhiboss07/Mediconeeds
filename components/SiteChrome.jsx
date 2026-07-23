import Frag from "@/components/Frag";
import Interactions from "@/components/Interactions";
import AddressPortal from "@/components/AddressPortal";
import MegaMenu from "@/components/MegaMenu";
import SearchOverlay from "@/components/SearchOverlay";
import MobileFooter from "@/components/mobile/MobileFooter";
import HeaderSearchPortal from "@/components/search/HeaderSearchPortal";
import { loadManifest, loadHtml, swapHeaderSearch } from "@/lib/fragments";

/**
 * Shared site chrome (header + footer) for inner pages, rendering the faithful
 * desktop tree (>=lg) and mobile tree (<lg). Page-specific content is passed in
 * via the `desktopContent` / `mobileContent` slots.
 *
 * `searchMode` puts the header into search mode for routes that ARE a search UI
 * (/search): the header's static search button is dropped from the markup and
 * the live <SearchField> takes its place, so such a route never stacks a second
 * search bar under the first. It also stands down the overlay, which exists
 * only to summon a field the header is already showing.
 */
export default function SiteChrome({
  desktopContent,
  mobileContent,
  content, // shared responsive content rendered in both trees (for content pages)
  mobileWrapClass = "min-h-screen bg-[#F7FAFF]",
  showBottomNav = false,
  searchMode = false,
}) {
  if (content) {
    desktopContent = content;
    mobileContent = content;
  }
  const dm = loadManifest("sections");
  const mm = loadManifest("mobile");
  const dItem = (n) => dm.items[n];
  const mItem = (n) => mm.items[n];

  const D_SLOT = "mc-search-slot-desktop";
  const M_SLOT = "mc-search-slot-mobile";
  const headerHtml = (dir, slotId) => {
    const html = loadHtml("header", dir);
    return searchMode ? swapHeaderSearch(html, slotId) : html;
  };

  return (
    <div className="__className_5f1e15 block">
      {/* ---------- DESKTOP ---------- */}
      <div className="hidden lg:block">
        <div className="min-h-screen">
          <Frag item={dItem("header")} html={headerHtml("sections", D_SLOT)} />
          {desktopContent}
        </div>
        <Frag item={dItem("footer")} html={loadHtml("footer", "sections")} />
        <MegaMenu />
      </div>

      {/* ---------- MOBILE ---------- */}
      <div className="lg:hidden">
        <div className={mobileWrapClass}>
          <Frag item={mItem("header")} html={headerHtml("mobile", M_SLOT)} />
          {mobileContent}
        </div>
        {showBottomNav && (
          <Frag item={mItem("bottom-nav")} html={loadHtml("bottom-nav", "mobile")} />
        )}
        <MobileFooter />
      </div>

      <Interactions />
      <AddressPortal />
      {searchMode
        ? <HeaderSearchPortal desktopSlotId={D_SLOT} mobileSlotId={M_SLOT} />
        : <SearchOverlay />}
    </div>
  );
}
