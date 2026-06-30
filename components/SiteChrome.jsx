import Frag from "@/components/Frag";
import Interactions from "@/components/Interactions";
import MegaMenu from "@/components/MegaMenu";
import SearchOverlay from "@/components/SearchOverlay";
import { loadManifest, loadHtml } from "@/lib/fragments";

/**
 * Shared site chrome (header + footer) for inner pages, rendering the faithful
 * desktop tree (>=lg) and mobile tree (<lg). Page-specific content is passed in
 * via the `desktopContent` / `mobileContent` slots.
 */
export default function SiteChrome({
  desktopContent,
  mobileContent,
  content, // shared responsive content rendered in both trees (for content pages)
  mobileWrapClass = "min-h-screen bg-[#F7FAFF]",
  showBottomNav = false,
}) {
  if (content) {
    desktopContent = content;
    mobileContent = content;
  }
  const dm = loadManifest("sections");
  const mm = loadManifest("mobile");
  const dItem = (n) => dm.items[n];
  const mItem = (n) => mm.items[n];

  return (
    <div className="__className_5f1e15 block">
      {/* ---------- DESKTOP ---------- */}
      <div className="hidden lg:block">
        <div className="min-h-screen">
          <Frag item={dItem("header")} html={loadHtml("header", "sections")} />
          {desktopContent}
        </div>
        <Frag item={dItem("footer")} html={loadHtml("footer", "sections")} />
        <MegaMenu />
      </div>

      {/* ---------- MOBILE ---------- */}
      <div className="lg:hidden">
        <div className={mobileWrapClass}>
          <Frag item={mItem("header")} html={loadHtml("header", "mobile")} />
          {mobileContent}
        </div>
        {showBottomNav && (
          <Frag item={mItem("bottom-nav")} html={loadHtml("bottom-nav", "mobile")} />
        )}
        <Frag item={mItem("footer")} html={loadHtml("footer", "mobile")} />
      </div>

      <Interactions />
      <SearchOverlay />
    </div>
  );
}
