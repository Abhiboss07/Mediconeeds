"use client";
import { Suspense, useMemo, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { addItem } from "@/lib/cart/store";

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");
const PAGE_SIZE = 12;

// Sort strategies. `featured`/`newest` use the product's original catalog index
// (added on load) since the data has no dedicated date field.
const SORTS = {
  featured: { label: "Featured", fn: (a, b) => a._idx - b._idx },
  bestselling: { label: "Best Selling", fn: (a, b) => b.reviews * b.rating - a.reviews * a.rating },
  priceLow: { label: "Price: Low → High", fn: (a, b) => a.price - b.price },
  priceHigh: { label: "Price: High → Low", fn: (a, b) => b.price - a.price },
  newest: { label: "Newest", fn: (a, b) => b._idx - a._idx },
  rating: { label: "Highest Rated", fn: (a, b) => b.rating - a.rating },
  discount: { label: "Discount", fn: (a, b) => (b.discount || 0) - (a.discount || 0) },
};
const SORT_KEYS = Object.keys(SORTS);

const RATING_STEPS = [4.5, 4.0, 3.5];

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
  const [added, setAdded] = useState(false);
  const add = () => {
    addItem({ id: p.id || p.slug, slug: p.slug, name: p.title, image: p.image, price: p.price, sku: p.variants?.[0]?.sku || "" });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };
  return (
    <div className="mc-card group flex flex-col rounded-[14px] border border-[rgba(111,115,132,0.18)] bg-white overflow-hidden hover:shadow-[0_8px_24px_rgba(14,27,77,0.10)] hover:-translate-y-0.5 transition-all">
      <a href={"/products/" + p.slug} className="flex flex-col flex-1">
        <div className="relative aspect-square p-3 bg-[#fafbff]">
          {p.discount > 0 && (
            <span className="absolute top-2 left-2 z-10 bg-[#e0633a] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{p.discount}% OFF</span>
          )}
          <img src={p.image} alt={p.title} className="w-full h-full object-contain" loading="lazy" />
        </div>
        <div className="flex flex-col gap-1 px-3 pt-1">
          <Stars rating={p.rating} />
          <p className="text-[13px] font-semibold text-[#0e1b4d] line-clamp-2 min-h-[34px] leading-[17px]">{p.title}</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-[15px] font-extrabold text-[#0e1b4d]">{inr(p.price)}</span>
            {p.compareAt > p.price && <span className="text-[12px] text-[#9ca3af] line-through">{inr(p.compareAt)}</span>}
          </div>
        </div>
      </a>
      <div className="px-3 pb-3 pt-2">
        <button onClick={add}
          className={`w-full inline-flex items-center justify-center h-[34px] rounded-full text-[13px] font-bold transition-colors ${added ? "bg-[#1E7A5A] text-white border border-[#1E7A5A]" : "border border-[#3056D3] text-[#3056D3] hover:bg-[#3056D3] hover:text-white"}`}>
          {added ? "Added ✓" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}

// A single facet group of checkbox options.
function CheckGroup({ title, options, selected, onToggle }) {
  if (!options.length) return null;
  return (
    <div className="border-b border-[rgba(111,115,132,0.15)] py-4">
      <p className="text-[13px] font-bold text-[#0e1b4d] mb-2.5">{title}</p>
      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer select-none">
            <input type="checkbox" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)}
              className="w-[15px] h-[15px] accent-[#3056D3] cursor-pointer" />
            <span className="flex-1">{o.label}</span>
            <span className="text-[11px] text-[#9ca3af]">{o.count}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Filters({ facets, sel, toggle, setSingle, commit, priceBounds, offersOnly }) {
  return (
    <>
      <CheckGroup title="Category" options={facets.category} selected={sel.category} onToggle={(v) => toggle("category", v)} />
      {facets.brand.length > 1 && (
        <CheckGroup title="Brand" options={facets.brand} selected={sel.brand} onToggle={(v) => toggle("brand", v)} />
      )}
      <CheckGroup title="Ingredient" options={facets.ingredient} selected={sel.ingredient} onToggle={(v) => toggle("ingredient", v)} />
      <CheckGroup title="Product Type" options={facets.skin} selected={sel.skin} onToggle={(v) => toggle("skin", v)} />

      {/* Price range */}
      <div className="border-b border-[rgba(111,115,132,0.15)] py-4">
        <p className="text-[13px] font-bold text-[#0e1b4d] mb-2.5">Price Range</p>
        <div className="flex items-center gap-2">
          <input type="number" inputMode="numeric" placeholder={String(priceBounds.min)} value={sel.minP} min={priceBounds.min} max={priceBounds.max}
            onChange={(e) => setSingle("minP", e.target.value)}
            className="w-full h-[36px] px-2 rounded-[8px] border border-[rgba(111,115,132,0.4)] text-[13px] outline-none focus:border-[#3056D3]" />
          <span className="text-[#9ca3af]">–</span>
          <input type="number" inputMode="numeric" placeholder={String(priceBounds.max)} value={sel.maxP} min={priceBounds.min} max={priceBounds.max}
            onChange={(e) => setSingle("maxP", e.target.value)}
            className="w-full h-[36px] px-2 rounded-[8px] border border-[rgba(111,115,132,0.4)] text-[13px] outline-none focus:border-[#3056D3]" />
        </div>
      </div>

      {/* Rating */}
      <div className="border-b border-[rgba(111,115,132,0.15)] py-4">
        <p className="text-[13px] font-bold text-[#0e1b4d] mb-2.5">Rating</p>
        <div className="flex flex-col gap-2">
          {RATING_STEPS.map((r) => (
            <label key={r} className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer select-none">
              <input type="checkbox" checked={sel.rating === String(r)} onChange={() => setSingle("rating", sel.rating === String(r) ? "" : String(r))}
                className="w-[15px] h-[15px] accent-[#3056D3] cursor-pointer" />
              <span className="inline-flex items-center gap-1"><svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>{r} &amp; up</span>
            </label>
          ))}
        </div>
      </div>

      {/* Offers + Availability */}
      <div className="py-4">
        <p className="text-[13px] font-bold text-[#0e1b4d] mb-2.5">Offers &amp; Availability</p>
        <div className="flex flex-col gap-2">
          {!offersOnly && (
            <label className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer select-none">
              <input type="checkbox" checked={sel.offers === "1"} onChange={() => setSingle("offers", sel.offers === "1" ? "" : "1")}
                className="w-[15px] h-[15px] accent-[#e0633a] cursor-pointer" />
              <span>On offer (discounted)</span>
            </label>
          )}
          <label className="flex items-center gap-2 text-[13px] text-[#374151] cursor-pointer select-none">
            <input type="checkbox" checked={sel.avail === "cod"} onChange={() => setSingle("avail", sel.avail === "cod" ? "" : "cod")}
              className="w-[15px] h-[15px] accent-[#1E7A5A] cursor-pointer" />
            <span>COD available</span>
          </label>
        </div>
      </div>
    </>
  );
}

function ListingInner({ products, defaultSort = "featured", offersOnly = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  // Tag each product with its catalog index once (for featured/newest ordering).
  const indexed = useMemo(() => products.map((p, i) => ({ ...p, _idx: i })), [products]);

  // ---- URL is the single source of truth (enables Back/Forward + shareable URLs) ----
  const getCSV = (k) => { const v = sp.get(k); return v ? v.split(",").filter(Boolean) : []; };
  const sel = {
    q: sp.get("q") || "",
    category: getCSV("category"),
    brand: getCSV("brand"),
    ingredient: getCSV("ingredient"),
    skin: getCSV("skin"),
    rating: sp.get("rating") || "",
    minP: sp.get("minP") || "",
    maxP: sp.get("maxP") || "",
    offers: offersOnly ? "1" : (sp.get("offers") || ""),
    avail: sp.get("avail") || "",
    sort: SORTS[sp.get("sort")] ? sp.get("sort") : defaultSort,
    page: Math.max(1, parseInt(sp.get("page") || "1", 10) || 1),
  };

  const commit = useCallback((mutate, { resetPage = true } = {}) => {
    const next = new URLSearchParams(sp.toString());
    mutate(next);
    if (resetPage) next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [sp, router, pathname]);

  const toggle = (key, val) => commit((n) => {
    const cur = (n.get(key) ? n.get(key).split(",") : []).filter(Boolean);
    const i = cur.indexOf(val);
    if (i >= 0) cur.splice(i, 1); else cur.push(val);
    if (cur.length) n.set(key, cur.join(",")); else n.delete(key);
  });
  const setSingle = (key, val) => commit((n) => { if (val) n.set(key, val); else n.delete(key); });
  const setSort = (val) => { commit((n) => { if (val && val !== defaultSort) n.set("sort", val); else n.delete("sort"); }); setSortOpen(false); };
  const goPage = (n) => commit((p) => { if (n > 1) p.set("page", String(n)); else p.delete("page"); }, { resetPage: false });
  const clearAll = () => router.push(pathname, { scroll: false });

  // ---- Facets derived from the working product set (options reflect reality) ----
  const facets = useMemo(() => {
    const build = (getter) => {
      const m = new Map();
      indexed.forEach((p) => { const vs = getter(p); (Array.isArray(vs) ? vs : [vs]).forEach((v) => { if (v) m.set(v, (m.get(v) || 0) + 1); }); });
      return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, label: value, count }));
    };
    return {
      category: build((p) => p.categoryName || p.category),
      brand: build((p) => p.brand),
      ingredient: build((p) => p.ingredient),
      skin: build((p) => p.skinTypes || []),
    };
  }, [indexed]);
  const priceBounds = useMemo(() => ({
    min: Math.min(...indexed.map((p) => p.price)),
    max: Math.max(...indexed.map((p) => p.price)),
  }), [indexed]);

  // ---- Apply filters + sort ----
  const filtered = useMemo(() => {
    let r = indexed.slice();
    if (offersOnly || sel.offers === "1") r = r.filter((p) => (p.discount || 0) > 0);
    if (sel.q.trim()) {
      const q = sel.q.toLowerCase();
      r = r.filter((p) => (p.title + " " + (p.categoryName || "") + " " + (p.ingredient || "") + " " + (p.brand || "")).toLowerCase().includes(q));
    }
    if (sel.category.length) r = r.filter((p) => sel.category.includes(p.categoryName || p.category));
    if (sel.brand.length) r = r.filter((p) => sel.brand.includes(p.brand));
    if (sel.ingredient.length) r = r.filter((p) => sel.ingredient.includes(p.ingredient));
    if (sel.skin.length) r = r.filter((p) => (p.skinTypes || []).some((s) => sel.skin.includes(s)));
    if (sel.rating) r = r.filter((p) => p.rating >= parseFloat(sel.rating));
    if (sel.minP) r = r.filter((p) => p.price >= Number(sel.minP));
    if (sel.maxP) r = r.filter((p) => p.price <= Number(sel.maxP));
    if (sel.avail === "cod") r = r.filter((p) => p.cod);
    r.sort(SORTS[sel.sort].fn);
    return r;
  }, [indexed, sel.q, sel.category, sel.brand, sel.ingredient, sel.skin, sel.rating, sel.minP, sel.maxP, sel.offers, sel.avail, sel.sort, offersOnly]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(sel.page, pages);
  const slice = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  const activeCount = sel.category.length + sel.brand.length + sel.ingredient.length + sel.skin.length
    + (sel.rating ? 1 : 0) + (sel.minP ? 1 : 0) + (sel.maxP ? 1 : 0) + (!offersOnly && sel.offers === "1" ? 1 : 0) + (sel.avail ? 1 : 0);

  return (
    <div className="lg:grid lg:grid-cols-[248px_1fr] lg:gap-7">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="hidden lg:block">
        <div className="sticky top-[92px]">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] font-extrabold text-[#0e1b4d]">Filters</h2>
            {activeCount > 0 && <button onClick={clearAll} className="text-[12px] font-semibold text-[#3056D3] hover:underline">Clear all ({activeCount})</button>}
          </div>
          <Filters facets={facets} sel={sel} toggle={toggle} setSingle={setSingle} commit={commit} priceBounds={priceBounds} offersOnly={offersOnly} />
        </div>
      </aside>

      {/* ---------- Main column ---------- */}
      <div className="min-w-0">
        {/* toolbar */}
        <div className="flex items-center gap-2 mb-4">
          <p className="text-[13px] text-[#6b7280] flex-1">
            <span className="font-bold text-[#0e1b4d]">{filtered.length}</span> product{filtered.length !== 1 ? "s" : ""}
            {sel.q && <> for “<span className="font-semibold text-[#0e1b4d]">{sel.q}</span>”</>}
          </p>
          {/* mobile filter/sort buttons */}
          <button onClick={() => setDrawer(true)}
            className="lg:hidden inline-flex items-center gap-1.5 h-[42px] px-3.5 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold text-[#0e1b4d] bg-white">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
            Filters{activeCount > 0 && <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[11px] rounded-full bg-[#3056D3] text-white px-1">{activeCount}</span>}
          </button>
          <button onClick={() => setSortOpen(true)}
            className="lg:hidden inline-flex items-center gap-1.5 h-[42px] px-3.5 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold text-[#0e1b4d] bg-white">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h13M3 12h9M3 18h5"/></svg>
            Sort
          </button>
          <select value={sel.sort} onChange={(e) => setSort(e.target.value)}
            className="hidden lg:block h-[42px] px-3 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold text-[#0e1b4d] bg-white outline-none focus:border-[#3056D3] cursor-pointer">
            {SORT_KEYS.map((k) => <option key={k} value={k}>Sort: {SORTS[k].label}</option>)}
          </select>
        </div>

        {/* active chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {[["category", sel.category], ["brand", sel.brand], ["ingredient", sel.ingredient], ["skin", sel.skin]].flatMap(([k, arr]) =>
              arr.map((v) => (
                <button key={k + v} onClick={() => toggle(k, v)} className="inline-flex items-center gap-1 text-[12px] font-semibold bg-[#eef2ff] text-[#3056D3] rounded-full pl-3 pr-2 py-1">
                  {v} <span className="text-[14px] leading-none">×</span>
                </button>
              ))
            )}
            {sel.rating && <button onClick={() => setSingle("rating", "")} className="inline-flex items-center gap-1 text-[12px] font-semibold bg-[#eef2ff] text-[#3056D3] rounded-full pl-3 pr-2 py-1">{sel.rating}★ &amp; up <span className="text-[14px] leading-none">×</span></button>}
            {(sel.minP || sel.maxP) && <button onClick={() => commit((n) => { n.delete("minP"); n.delete("maxP"); })} className="inline-flex items-center gap-1 text-[12px] font-semibold bg-[#eef2ff] text-[#3056D3] rounded-full pl-3 pr-2 py-1">{inr(sel.minP || priceBounds.min)}–{inr(sel.maxP || priceBounds.max)} <span className="text-[14px] leading-none">×</span></button>}
            {!offersOnly && sel.offers === "1" && <button onClick={() => setSingle("offers", "")} className="inline-flex items-center gap-1 text-[12px] font-semibold bg-[#fdece5] text-[#e0633a] rounded-full pl-3 pr-2 py-1">On offer <span className="text-[14px] leading-none">×</span></button>}
            {sel.avail && <button onClick={() => setSingle("avail", "")} className="inline-flex items-center gap-1 text-[12px] font-semibold bg-[#e6f4ee] text-[#1E7A5A] rounded-full pl-3 pr-2 py-1">COD <span className="text-[14px] leading-none">×</span></button>}
          </div>
        )}

        {/* grid */}
        {slice.length === 0 ? (
          <div className="text-center py-20 text-[#6b7280]">
            <p className="text-[15px] font-semibold text-[#0e1b4d] mb-1">No products match your filters.</p>
            <button onClick={clearAll} className="text-[13px] font-semibold text-[#3056D3] hover:underline">Clear all filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {slice.map((p) => <Card key={p.id} p={p} />)}
          </div>
        )}

        {/* pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-8">
            <button disabled={cur === 1} onClick={() => goPage(cur - 1)}
              className="h-[36px] px-3 rounded-full border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold text-[#0e1b4d] disabled:opacity-40">Prev</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => goPage(n)}
                className={`h-[36px] w-[36px] rounded-full text-[13px] font-bold ${n === cur ? "bg-[#3056D3] text-white" : "border border-[rgba(111,115,132,0.4)] text-[#0e1b4d]"}`}>{n}</button>
            ))}
            <button disabled={cur === pages} onClick={() => goPage(cur + 1)}
              className="h-[36px] px-3 rounded-full border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold text-[#0e1b4d] disabled:opacity-40">Next</button>
          </div>
        )}
      </div>

      {/* ---------- Mobile filter drawer ---------- */}
      {drawer && (
        <div className="fixed inset-0 z-[300] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[86%] max-w-[360px] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-[56px] border-b border-[rgba(111,115,132,0.15)] shrink-0">
              <span className="text-[16px] font-extrabold text-[#0e1b4d]">Filters</span>
              <button onClick={() => setDrawer(false)} aria-label="Close" className="text-[24px] leading-none text-[#6b7280] px-1">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <Filters facets={facets} sel={sel} toggle={toggle} setSingle={setSingle} commit={commit} priceBounds={priceBounds} offersOnly={offersOnly} />
            </div>
            <div className="flex gap-3 p-4 border-t border-[rgba(111,115,132,0.15)] shrink-0">
              <button onClick={clearAll} className="flex-1 h-[46px] rounded-full border border-[#3056D3] text-[#3056D3] text-[14px] font-bold">Clear all</button>
              <button onClick={() => setDrawer(false)} className="flex-1 h-[46px] rounded-full bg-[#3056D3] text-white text-[14px] font-bold">Show {filtered.length}</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Mobile sort sheet ---------- */}
      {sortOpen && (
        <div className="fixed inset-0 z-[300] lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSortOpen(false)} />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[20px] p-4">
            <div className="mx-auto w-10 h-1 rounded-full bg-[#e5e7eb] mb-3" />
            <p className="text-[15px] font-extrabold text-[#0e1b4d] mb-2">Sort by</p>
            {SORT_KEYS.map((k) => (
              <button key={k} onClick={() => setSort(k)}
                className={`flex items-center justify-between w-full h-[46px] px-3 rounded-[10px] text-[14px] ${sel.sort === k ? "bg-[#eef2ff] text-[#3056D3] font-bold" : "text-[#374151]"}`}>
                {SORTS[k].label}
                {sel.sort === k && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3056D3" strokeWidth="2.5"><path d="m5 12 5 5 9-11"/></svg>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductListing(props) {
  return (
    <Suspense fallback={<div className="py-20 text-center text-[#6b7280] text-[14px]">Loading products…</div>}>
      <ListingInner {...props} />
    </Suspense>
  );
}
