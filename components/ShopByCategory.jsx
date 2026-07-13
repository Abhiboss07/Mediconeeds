// "Shop by Category" grid — matches the reference: every taxonomy category is
// always shown as a coloured letter tile. The count is the REAL live number
// ("3 Products") or "Coming Soon" when the category has no live products (count
// 0). Categories with products link to their filtered listing; "Coming Soon"
// ones are non-interactive. Fully database-driven — no hardcoded counts.
export default function ShopByCategory({ categories = [], variant = "desktop" }) {
  if (!categories.length) return null;
  const mobile = variant === "mobile";

  const Tile = ({ c }) => {
    const live = c.count > 0;
    const inner = (
      <>
        <div
          className="w-[46px] h-[46px] lg:w-[52px] lg:h-[52px] rounded-[12px] flex items-center justify-center text-[20px] lg:text-[22px] font-extrabold"
          style={{ background: (c.color || "#3056d3") + "1f", color: c.color || "#3056d3" }}
        >
          {c.name.charAt(0).toUpperCase()}
        </div>
        <p className="text-center text-[12px] lg:text-[13.5px] font-bold leading-tight text-[#1F3580]">{c.name}</p>
        <p className={`text-center text-[10.5px] lg:text-[11.5px] ${live ? "text-[#6f7384]" : "text-[#9aa0b4] italic"}`}>
          {live ? `${c.count} ${c.count === 1 ? "Product" : "Products"}` : "Coming Soon"}
        </p>
      </>
    );
    const cls = "flex flex-col items-center justify-center gap-1.5 w-full min-h-[112px] lg:min-h-[124px] px-2 py-3 bg-white rounded-[12px] border-[0.8px] border-[rgba(111,115,132,0.18)] shadow-[0_1px_2px_rgba(14,27,77,0.04)]";
    return live ? (
      <a href={`/products?category=${encodeURIComponent(c.name)}`} aria-label={`${c.name} — ${c.count} ${c.count === 1 ? "product" : "products"}`}
        className={cls + " transition-all duration-200 hover:shadow-[inset_0_0_0_1.5px_#6082EE,0_2px_8px_rgba(14,27,77,0.10)]"}>
        {inner}
      </a>
    ) : (
      <div aria-label={`${c.name} — coming soon`} className={cls + " opacity-90"}>{inner}</div>
    );
  };

  return (
    <section className={mobile ? "px-4 py-3" : "flex flex-col gap-3 lg:gap-4"}>
      <h2 className={mobile ? "text-[18px] font-extrabold text-[#0e1b4d] mb-1" : "text-[19px] lg:text-[22px] font-extrabold text-[#0e1b4d]"}>Shop by Category</h2>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-[0.75rem] lg:gap-[0.9rem]">
        {categories.map((c) => <Tile key={c.name} c={c} />)}
      </div>
    </section>
  );
}
