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
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-[1.125rem] lg:gap-[1.38rem]">
        {ingredients.map((ing) => (
          <a
            key={ing.name}
            href={`/products?ingredient=${encodeURIComponent(ing.name)}`}
            aria-label={`${ing.name} — ${ing.count} ${ing.count === 1 ? "product" : "products"}`}
            className="flex flex-col items-center justify-center gap-2 aspect-square w-full px-2 py-1.5 lg:pt-[0.713rem] lg:pb-[0.713rem] bg-white/70 rounded-[12px] lg:rounded-[0.713rem] border-[0.48px] border-[rgba(111,115,132,0.2)] shadow-[0.119rem_0.119rem_0.119rem_rgba(0,0,0,0.02)] transition-all duration-200 hover:shadow-[inset_0_0_0_1.5px_#6082EE,0.119rem_0.119rem_0.231rem_rgba(0,0,0,0.15)]"
          >
            <div className="w-[3.4rem] h-[3.4rem] lg:w-[66px] lg:h-[66px] rounded-full flex items-center justify-center text-[18px] lg:text-[22px] font-extrabold" style={{ background: "#eef2ff", color: "#3056D3" }}>
              {ing.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-center text-[12px] lg:text-[14px] font-bold" style={{ color: "#1F3580" }}>{ing.name}</p>
            <p className="text-center text-[10.5px] lg:text-[12px] text-[#6f7384]">{ing.count} {ing.count === 1 ? "product" : "products"}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
