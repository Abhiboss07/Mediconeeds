// Database-driven "Shop by Ingredient" grid. Unlike the category grid (which
// only shows categories that have products), this keeps the full ingredient
// taxonomy visible and shows each ingredient's REAL live count — including
// "0 products" — so the section is never removed and never shows fake numbers.
// Each card links to the PLP ingredient filter.
export default function ShopByIngredient({ ingredients = [], variant = "desktop" }) {
  if (!ingredients.length) return null;
  const mobile = variant === "mobile";
  return (
    <section className={mobile ? "px-4 py-3" : "flex flex-col gap-4 lg:gap-6"}>
      <div className="flex items-center justify-between">
        <h2 className={mobile ? "text-[18px] font-extrabold text-[#0e1b4d]" : "sc-edc1745e-0 lbuWQp"}>Shop by Ingredient</h2>
        <a href="/products" className="text-[13px] font-semibold text-[#3056d3] hover:underline">View All</a>
      </div>
      <div className="flex gap-[0.75rem] lg:gap-[0.9rem] overflow-x-auto pb-1 mn-noscroll">
        {ingredients.map((ing) => (
          <a
            key={ing.name}
            href={`/products?ingredient=${encodeURIComponent(ing.name)}`}
            aria-label={ing.count > 0 ? `${ing.name} — ${ing.count} ${ing.count === 1 ? "product" : "products"}` : `${ing.name} — coming soon`}
            className="shrink-0 w-[104px] lg:w-[128px] flex flex-col items-center justify-center gap-1.5 px-2 py-3 bg-white rounded-[12px] border-[0.8px] border-[rgba(111,115,132,0.18)] shadow-[0_1px_2px_rgba(14,27,77,0.04)] transition-all duration-200 hover:shadow-[inset_0_0_0_1.5px_#6082EE,0_2px_8px_rgba(14,27,77,0.10)]"
          >
            <div className="w-[2.9rem] h-[2.9rem] lg:w-[52px] lg:h-[52px] rounded-full flex items-center justify-center text-[16px] lg:text-[20px] font-extrabold" style={{ background: "#eef2ff", color: "#3056D3" }}>
              {ing.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-center text-[11.5px] lg:text-[13px] font-bold leading-tight" style={{ color: "#1F3580" }}>{ing.name}</p>
            <p className={`text-center text-[10px] lg:text-[11px] ${ing.count > 0 ? "text-[#6f7384]" : "text-[#9aa0b4] italic"}`}>
              {ing.count > 0 ? `${ing.count} ${ing.count === 1 ? "Product" : "Products"}` : "Coming Soon"}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}
