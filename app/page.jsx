import Frag from "@/components/Frag";
import Interactions from "@/components/Interactions";
import AddressPortal from "@/components/AddressPortal";
import MegaMenu from "@/components/MegaMenu";
import SearchOverlay from "@/components/SearchOverlay";
import { loadManifest, loadHtml } from "@/lib/fragments";

export default function Home() {
  // ---- Desktop tree (>= lg) ----
  const dm = loadManifest("sections");
  const d = (name) => ({ item: dm.items[name], html: loadHtml(name, "sections") });
  const dHeader = d("header");
  const dBanner = d("banner");
  const dSidebar = d("sidebar");
  const dFooter = d("footer");

  // ---- Mobile tree (< lg) ----
  const mm = loadManifest("mobile");
  const m = (name) => ({ item: mm.items[name], html: loadHtml(name, "mobile") });
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
