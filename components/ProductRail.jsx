// Horizontal rail of REAL products from the live catalogue. Replaces the static
// clone carousels ("Our Bestsellers", "New Launches", "Summer Essentials") whose
// cards showed mock product names/prices/ratings that don't exist in the real
// catalogue. Renders nothing when there are no products, so the section hides
// gracefully.
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

export default function ProductRail({ title = "Our Products", products = [], viewAllHref = "/products" }) {
  if (!products.length) return null;
  return (
    <section className="flex flex-col gap-4 lg:gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] lg:text-[22px] font-extrabold text-[#0e1b4d]">{title}</h2>
        <a href={viewAllHref} className="text-[13px] font-semibold text-[#3056d3] hover:underline">View All</a>
      </div>
      <div className="flex gap-3 lg:gap-4 overflow-x-auto pb-2 mn-noscroll">
        {products.map((p) => (
          <a
            key={p.slug}
            href={`/products/${p.slug}`}
            className="shrink-0 w-[150px] lg:w-[196px] bg-white rounded-[12px] border border-[rgba(111,115,132,0.18)] overflow-hidden hover:shadow-[0_8px_24px_rgba(14,27,77,0.10)] transition-shadow"
          >
            <div className="aspect-square p-2 relative bg-[#fafbfe]">
              <img src={p.image} alt={p.title} className="w-full h-full object-contain" width="196" height="196" />
              {p.discount > 0 && (
                <span className="absolute top-2 left-2 text-[10px] font-bold text-white bg-[#1e7a5a] rounded px-1.5 py-0.5">{p.discount}% OFF</span>
              )}
            </div>
            <div className="px-3 pb-3">
              <div className="text-[12.5px] font-semibold text-[#0e1b4d] line-clamp-2 min-h-[34px]">{p.title}</div>
              {p.rating > 0 && (
                <div className="text-[11px] text-[#8a93a6] mt-1">★ {p.rating.toFixed(1)}{p.reviews ? ` (${p.reviews})` : ""}</div>
              )}
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-[14px] font-bold text-[#0e1b4d]">{inr(p.price)}</span>
                {p.compareAt > p.price && <span className="text-[11px] text-[#9ca3af] line-through">{inr(p.compareAt)}</span>}
              </div>
              <div className="text-[10.5px] font-semibold mt-1" style={{ color: p.stock > 0 ? "#1e7a5a" : "#c0392b" }}>
                {p.stock > 0 ? "In stock" : "Out of stock"}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
