// Database-driven "Shop by Category" grid. Replaces the old static clone section
// whose counts were hardcoded (e.g. "Sunscreen 48 products") and which linked to
// categories with no real products. Every card here comes from live published
// CatalogProducts: real count, a real product image, and a link that the PLP
// category filter actually matches. Renders nothing when the catalogue is empty
// (section hides gracefully).
export default function ShopByCategory({ categories = [], variant = "desktop" }) {
  if (!categories.length) return null;
  const mobile = variant === "mobile";
  return (
    <div className={mobile ? "px-4 py-3" : "flex flex-col gap-4 lg:gap-6"}>
      <h2 className={mobile ? "text-[18px] font-extrabold text-[#0e1b4d] mb-3" : "sc-edc1745e-0 lbuWQp"}>Shop by Category</h2>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-[1.125rem] lg:gap-[1.38rem]">
        {categories.map((c) => (
          <a
            key={c.name}
            href={`/products?category=${encodeURIComponent(c.name)}`}
            aria-label={`${c.name} — ${c.count} ${c.count === 1 ? "product" : "products"}`}
            className="flex flex-col items-center justify-center gap-2 aspect-square w-full px-2 py-1.5 lg:pt-[0.713rem] lg:pb-[0.713rem] lg:pl-[0.951rem] lg:pr-[0.951rem] bg-white/70 rounded-[12px] lg:rounded-[0.713rem] border-[0.48px] border-[rgba(111,115,132,0.2)] shadow-[0.119rem_0.119rem_0.119rem_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[inset_0_0_0_1.5px_#6082EE,0.119rem_0.119rem_0.231rem_rgba(0,0,0,0.15)]"
          >
            <div className="w-[4.06rem] h-[4.06rem] lg:w-[92px] lg:h-[92px] relative">
              {c.image
                ? <img src={c.image} alt={c.name} className="w-full h-full object-contain" width="92" height="92" />
                : <div className="w-full h-full rounded-full" style={{ background: c.color, opacity: 0.15 }} />}
            </div>
            <p className="text-center text-[13px] lg:text-[15px] font-bold" style={{ color: "#1F3580" }}>{c.name}</p>
            <p className="text-center text-[11px] lg:text-[12px] text-[#6f7384]">{c.count} {c.count === 1 ? "product" : "products"}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
