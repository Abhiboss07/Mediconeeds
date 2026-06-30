import Frag from "@/components/Frag";
import SiteChrome from "@/components/SiteChrome";
import { loadManifest, loadHtml } from "@/lib/fragments";

// Phase 1 UI clone: a single captured Product Detail Page rendered for any slug.
// (Real per-product data arrives in Phase 2.)
export default function ProductPage() {
  const pm = loadManifest("pdp");
  return (
    <SiteChrome
      desktopContent={<Frag item={pm.desktop} html={loadHtml("desktop", "pdp")} />}
      mobileContent={<Frag item={pm.mobile} html={loadHtml("mobile", "pdp")} />}
      mobileWrapClass={pm.mobile.class}
    />
  );
}
