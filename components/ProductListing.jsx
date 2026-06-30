"use client";
import { useMemo, useState } from "react";

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const PAGE_SIZE = 12;

const SORTS = {
  popularity: { label: "Popularity", fn: (a, b) => b.reviews * b.rating - a.reviews * a.rating },
  discount: { label: "Biggest discount", fn: (a, b) => (b.discount || 0) - (a.discount || 0) },
  priceLow: { label: "Price: low to high", fn: (a, b) => a.price - b.price },
  priceHigh: { label: "Price: high to low", fn: (a, b) => b.price - a.price },
  rating: { label: "Customer rating", fn: (a, b) => b.rating - a.rating },
};

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0e1b4d]">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B" aria-hidden="true">
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      {rating}
    </span>
  );
}

function Card({ p }) {
  return (
    <a href={"/products/" + p.slug}
       className="mc-card group flex flex-col rounded-[14px] border border-[rgba(111,115,132,0.18)] bg-white overflow-hidden hover:shadow-[0_8px_24px_rgba(14,27,77,0.10)] hover:-translate-y-0.5 transition-all">
      <div className="relative aspect-square p-3 bg-[#fafbff]">
        {p.discount > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-[#e0633a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{p.discount}% OFF</span>
        )}
        <img src={p.image} alt={p.title} className="w-full h-full object-contain" loading="lazy" />
      </div>
      <div className="flex flex-col gap-1 px-3 pb-3 pt-1">
        <Stars rating={p.rating} />
        <p className="text-[13px] font-semibold text-[#0e1b4d] line-clamp-2 min-h-[34px] leading-[17px]">{p.title}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-[15px] font-extrabold text-[#0e1b4d]">{inr(p.price)}</span>
          {p.compareAt > p.price && <span className="text-[12px] text-[#9ca3af] line-through">{inr(p.compareAt)}</span>}
        </div>
        <span className="mt-2 inline-flex items-center justify-center h-[34px] rounded-full border border-[#3056D3] text-[#3056D3] text-[13px] font-bold group-hover:bg-[#3056D3] group-hover:text-white transition-colors">
          View product
        </span>
      </div>
    </a>
  );
}

export default function ProductListing({ products, categories = [], defaultSort = "popularity", offersOnly = false }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState(defaultSort);
  const [maxPrice, setMaxPrice] = useState(0);
  const [minDisc, setMinDisc] = useState(0);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let r = products.slice();
    if (offersOnly) r = r.filter((p) => (p.discount || 0) > 0);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((p) => (p.title + " " + (p.categoryName || "") + " " + (p.ingredient || "")).toLowerCase().includes(q));
    }
    if (cat !== "all") r = r.filter((p) => p.category === cat);
    if (maxPrice > 0) r = r.filter((p) => p.price <= maxPrice);
    if (minDisc > 0) r = r.filter((p) => (p.discount || 0) >= minDisc);
    r.sort(SORTS[sort].fn);
    return r;
  }, [products, query, cat, sort, maxPrice, minDisc, offersOnly]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);
  const reset = (fn) => { fn(); setPage(1); };

  return (
    <div>
      {/* controls */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input
            value={query} onChange={(e) => reset(() => setQuery(e.target.value))}
            placeholder="Search products…"
            className="w-full h-[44px] pl-9 pr-4 rounded-full border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3] bg-white"
          />
        </div>
        <select value={cat} onChange={(e) => reset(() => setCat(e.target.value))}
          className="h-[44px] px-4 rounded-full border border-[rgba(111,115,132,0.4)] text-[14px] text-[#0e1b4d] bg-white outline-none focus:border-[#3056D3]">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.handle} value={c.handle}>{c.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="h-[44px] px-4 rounded-full border border-[rgba(111,115,132,0.4)] text-[14px] text-[#0e1b4d] bg-white outline-none focus:border-[#3056D3]">
          {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>Sort: {v.label}</option>)}
        </select>
      </div>

      {/* quick filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[0, 500, 1000, 2000].map((v) => (
          <button key={v} onClick={() => reset(() => setMaxPrice(v))}
            className={`px-3 h-[32px] rounded-full text-[12px] font-semibold border transition-colors ${maxPrice === v ? "bg-[#3056D3] text-white border-[#3056D3]" : "bg-white text-[#3056D3] border-[rgba(48,86,211,0.4)]"}`}>
            {v === 0 ? "Any price" : `Under ${inr(v)}`}
          </button>
        ))}
        {[0, 20, 40].map((v) => (
          <button key={"d" + v} onClick={() => reset(() => setMinDisc(v))}
            className={`px-3 h-[32px] rounded-full text-[12px] font-semibold border transition-colors ${minDisc === v ? "bg-[#e0633a] text-white border-[#e0633a]" : "bg-white text-[#e0633a] border-[rgba(224,99,58,0.4)]"}`}>
            {v === 0 ? "Any discount" : `${v}%+ off`}
          </button>
        ))}
      </div>

      <p className="text-[13px] text-[#6b7280] mb-4">{filtered.length} product{filtered.length !== 1 ? "s" : ""}</p>

      {slice.length === 0 ? (
        <div className="text-center py-16 text-[#6b7280]">No products match your filters.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          {slice.map((p) => <Card key={p.id} p={p} />)}
        </div>
      )}

      {/* pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8">
          <button disabled={cur === 1} onClick={() => setPage(cur - 1)}
            className="h-[36px] px-3 rounded-full border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold text-[#0e1b4d] disabled:opacity-40">Prev</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={`h-[36px] w-[36px] rounded-full text-[13px] font-bold ${n === cur ? "bg-[#3056D3] text-white" : "border border-[rgba(111,115,132,0.4)] text-[#0e1b4d]"}`}>{n}</button>
          ))}
          <button disabled={cur === pages} onClick={() => setPage(cur + 1)}
            className="h-[36px] px-3 rounded-full border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold text-[#0e1b4d] disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
