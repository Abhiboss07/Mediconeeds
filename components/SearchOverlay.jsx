"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TRENDING = ["Vitamin C Serum", "SPF 50 Sunscreen", "Glow Care Combo", "Niacinamide", "Retinol Serum", "Anti-Dandruff Shampoo"];

export default function SearchOverlay() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  // Submit a search → hand off to the full listing (/products) so results flow
  // through the same sort / filter / pagination engine.
  const submit = (term) => {
    const t = (term ?? q).trim();
    if (!t) return;
    setOpen(false);
    router.push("/products?q=" + encodeURIComponent(t));
  };

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mn:open-search", onOpen);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mn:open-search", onOpen); window.removeEventListener("keydown", onKey); };
  }, []);

  // Live results from MongoDB via the catalogue search API (debounced).
  const [results, setResults] = useState([]);
  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/catalog/search?q=" + encodeURIComponent(q.trim()), { signal: ctrl.signal });
        const data = await r.json();
        setResults(data.items || []);
      } catch { /* aborted / offline */ }
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40" onMouseDown={() => setOpen(false)}>
      <div
        className="mx-auto mt-0 bg-white w-full max-w-[760px] rounded-b-[20px] shadow-[0_20px_60px_rgba(14,27,77,0.25)] p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center h-[48px] px-4 rounded-full border border-[rgba(48,86,211,0.5)] bg-white">
          <span className="text-[#64748B] mr-2">🔍</span>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Search serums, sunscreen, ingredients…"
            className="flex-1 outline-none text-[15px] bg-transparent"
          />
          <button onClick={() => setOpen(false)} className="text-[#6b7280] text-[20px] leading-none px-1">×</button>
        </div>

        {q.trim() && (
          <button onClick={() => submit()} className="mt-3 w-full h-[42px] rounded-full bg-[#3056D3] text-white text-[14px] font-bold">
            View all results for “{q.trim()}”
          </button>
        )}

        {!q && (
          <div className="mt-4">
            <p className="text-[12px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-2">Trending</p>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((t) => (
                <button key={t} onClick={() => setQ(t)} className="text-[13px] bg-[#f5f6fb] rounded-full px-3 py-1.5 text-[#0e1b4d]">{t}</button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="text-[12px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-2">{q ? "Results" : "Popular products"}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[46vh] overflow-y-auto">
            {results.map((p) => (
              <a key={p.id} href={"/products/" + p.slug} className="flex items-center gap-2 p-2 rounded-[12px] hover:bg-[#f5f6fb]">
                <img src={p.image} alt={p.title} className="w-12 h-12 rounded-[8px] object-contain border border-[#eef0f5] bg-white" />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-[#0e1b4d] line-clamp-2">{p.title}</div>
                  <div className="text-[12px] text-[#3056D3] font-bold">₹{p.price.toLocaleString("en-IN")}</div>
                </div>
              </a>
            ))}
            {results.length === 0 && <p className="text-[14px] text-[#6b7280] col-span-full py-6 text-center">No products found for “{q}”.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
