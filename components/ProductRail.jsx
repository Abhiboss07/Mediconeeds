"use client";
// Horizontal rail of REAL products from the live catalogue, styled to match the
// reference product card (image, rating, title, price/old-price/discount, Add
// button). Never injects mock products; shows a clean "Coming Soon" state when a
// section has no matching products so the layout is preserved.
import { addItem } from "@/lib/cart/store";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

function Card({ p }) {
  const add = (e) => {
    e.preventDefault();
    addItem({ id: p.id || p.slug, slug: p.slug, name: p.title, image: p.image, price: p.price, sku: p.variants?.[0]?.sku || "" });
  };
  return (
    <a href={`/products/${p.slug}`} className="shrink-0 w-[168px] lg:w-[184px] bg-white rounded-[10px] border border-[rgba(111,115,132,0.16)] hover:shadow-[0_6px_20px_rgba(14,27,77,0.10)] transition-shadow flex flex-col">
      <div className="aspect-square p-3 bg-[#fafbfe] rounded-t-[10px] flex items-center justify-center">
        <img src={p.image} alt={p.title} className="max-w-full max-h-full object-contain" />
      </div>
      <div className="px-2.5 pt-2 pb-2.5 flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-1 text-[10.5px] text-[#f5a623] font-semibold">★ <span className="text-[#6f7384]">({(p.rating || 0).toFixed(1)})</span></div>
        <div className="text-[11.5px] text-[#0e1b4d] font-semibold leading-snug line-clamp-2 min-h-[30px]">{p.title}</div>
        <div className="flex items-baseline flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
          <span className="text-[13.5px] font-extrabold text-[#0e1b4d]">{inr(p.price)}</span>
          {p.compareAt > p.price && <span className="text-[10.5px] text-[#9ca3af] line-through">{inr(p.compareAt)}</span>}
          {p.discount > 0 && <span className="text-[10px] font-bold text-[#1e7a5a]">{p.discount}% OFF</span>}
        </div>
        <button onClick={add} className="mt-1.5 h-[30px] rounded-[8px] border border-[#3056d3] text-[#3056d3] text-[12px] font-bold hover:bg-[#eef2ff] transition-colors">Add</button>
      </div>
    </a>
  );
}

export default function ProductRail({ title = "Our Products", products = [], viewAllHref = "/products", keepWhenEmpty = false }) {
  if (!products.length && !keepWhenEmpty) return null;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[19px] lg:text-[22px] font-extrabold text-[#0e1b4d]">{title}</h2>
        {products.length > 0 && <a href={viewAllHref} className="text-[12.5px] font-semibold text-[#3056d3] hover:underline">View All</a>}
      </div>
      {products.length ? (
        <div className="flex gap-3 lg:gap-3.5 overflow-x-auto pb-1 mn-noscroll">
          {products.map((p) => <Card key={p.slug} p={p} />)}
        </div>
      ) : (
        <div className="rounded-[10px] border border-dashed border-[rgba(111,115,132,0.3)] bg-white/60 py-10 text-center text-[13px] text-[#9aa0b4] italic">
          Coming Soon
        </div>
      )}
    </section>
  );
}
