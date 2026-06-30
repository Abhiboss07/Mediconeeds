import Frag from "@/components/Frag";
import SiteChrome from "@/components/SiteChrome";
import { loadManifest, loadHtml } from "@/lib/fragments";

// Shop / Product Listing page (Phase 1 UI clone — captured "Skincare Bestsellers" listing with filters, sort, grid and pagination).
export default function PlpPage() {
  const pm = loadManifest("plp");
  return (
    <SiteChrome
      desktopContent={<Frag item={pm.desktop} html={loadHtml("desktop", "plp")} />}
      mobileContent={<Frag item={pm.mobile} html={loadHtml("mobile", "plp")} />}
      mobileWrapClass={pm.mobile.class}
    />
  );
}
