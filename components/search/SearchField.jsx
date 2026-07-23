"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export const TRENDING = [
  "Vitamin C Serum",
  "SPF 50 Sunscreen",
  "Glow Care Combo",
  "Niacinamide",
  "Retinol Serum",
  "Anti-Dandruff Shampoo",
];

const HISTORY_KEY = "mn:recent-searches";
const HISTORY_MAX = 6;

function readHistory() {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string").slice(0, HISTORY_MAX) : [];
  } catch {
    return [];
  }
}

function pushHistory(term) {
  try {
    const next = [term, ...readHistory().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, HISTORY_MAX);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return readHistory();
  }
}

/**
 * The single search input for the whole storefront.
 *
 * Both entry points render THIS component — the modal overlay opened from the
 * header (`variant="overlay"`) and the /search page, where it is portalled into
 * the header's own search slot (`variant="header"`). There is deliberately no
 * second implementation: the /search route used to ship its own <form> while
 * the header shipped another, so the search page showed two search bars.
 *
 * Owns suggestions (debounced /api/catalog/search), trending terms, recent
 * search history (localStorage), and keyboard navigation. Submitting hands the
 * query to /products so results flow through the real sort/filter/paging engine.
 */
export default function SearchField({
  variant = "overlay",
  autoFocus = false,
  onDismiss,
  className = "",
}) {
  const router = useRouter();
  const isHeader = variant === "header";
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [openPanel, setOpenPanel] = useState(variant === "overlay");
  const [active, setActive] = useState(-1); // keyboard cursor into `options`
  const inputRef = useRef(null);
  const rootRef = useRef(null);
  // The header field autofocuses on /search so the caret is ready to type, but
  // that programmatic focus must not fling the suggestions panel open over the
  // page's own trending/popular content on arrival. Swallow exactly that one
  // focus event; every later focus opens the panel normally.
  const swallowFocus = useRef(isHeader && autoFocus);

  const term = q.trim();

  useEffect(() => setHistory(readHistory()), []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Debounced live suggestions. Skipped entirely while the panel is closed so a
  // collapsed header field never polls the catalogue API.
  useEffect(() => {
    if (!openPanel) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch("/api/catalog/search?q=" + encodeURIComponent(term), { signal: ctrl.signal });
        const data = await r.json();
        setResults(data.items || []);
      } catch {
        /* aborted / offline */
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term, openPanel]);

  const submit = useCallback(
    (raw) => {
      const t = (raw ?? q).trim();
      if (!t) return;
      setHistory(pushHistory(t));
      setOpenPanel(false);
      onDismiss?.();
      router.push("/products?q=" + encodeURIComponent(t));
    },
    [q, onDismiss, router]
  );

  // Flat list the arrow keys walk: the "see all" row first, then each product.
  const options = useMemo(() => {
    const opts = term ? [{ kind: "all", label: term }] : [];
    return opts.concat(results.map((p) => ({ kind: "product", product: p })));
  }, [term, results]);

  useEffect(() => setActive(-1), [term]);

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpenPanel(false);
      onDismiss?.();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!options.length) return;
      e.preventDefault();
      setOpenPanel(true);
      setActive((i) => {
        const n = options.length;
        return e.key === "ArrowDown" ? (i + 1) % n : (i <= 0 ? n : i) - 1;
      });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const sel = options[active];
      if (sel?.kind === "product") router.push("/products/" + sel.product.slug);
      else submit();
    }
  };

  // Header variant collapses its panel on outside click; the overlay variant is
  // dismissed by its own backdrop instead.
  useEffect(() => {
    if (!isHeader || !openPanel) return;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpenPanel(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [isHeader, openPanel]);

  const chip =
    "text-[13px] bg-[#f5f6fb] rounded-full px-3 py-1.5 text-[#0e1b4d] hover:bg-[#e8ebf7] min-h-[36px] inline-flex items-center";

  const panel = (
    <>
      {!term && history.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-bold tracking-[0.1em] text-[#3056D3] uppercase">Recent</p>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(HISTORY_KEY);
                } catch {}
                setHistory([]);
              }}
              className="text-[12px] text-[#6b7280] hover:text-[#0e1b4d]"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((t) => (
              <button key={t} type="button" onClick={() => submit(t)} className={chip}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {!term && (
        <div className="mb-4">
          <p className="text-[12px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-2">Trending</p>
          <div className="flex flex-wrap gap-2">
            {TRENDING.map((t) => (
              <button key={t} type="button" onClick={() => setQ(t)} className={chip}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {term && (
        <button
          type="button"
          onMouseEnter={() => setActive(0)}
          onClick={() => submit()}
          className={`mb-3 w-full h-[42px] rounded-full text-[14px] font-bold ${
            active === 0 ? "bg-[#24409f] text-white" : "bg-[#3056D3] text-white"
          }`}
        >
          View all results for “{term}”
        </button>
      )}

      <div>
        <p className="text-[12px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-2">
          {term ? "Results" : "Popular products"}
        </p>
        <div
          role="listbox"
          aria-label="Search suggestions"
          className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[46vh] overflow-y-auto"
        >
          {results.map((p, i) => {
            const idx = term ? i + 1 : i;
            return (
              <a
                key={p.id}
                href={"/products/" + p.slug}
                role="option"
                aria-selected={active === idx}
                onMouseEnter={() => setActive(idx)}
                className={`flex items-center gap-2 p-2 rounded-[12px] min-h-[44px] ${
                  active === idx ? "bg-[#eef2ff]" : "hover:bg-[#f5f6fb]"
                }`}
              >
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-12 h-12 rounded-[8px] object-contain border border-[#eef0f5] bg-white shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-[#0e1b4d] line-clamp-2">{p.title}</div>
                  <div className="text-[12px] text-[#3056D3] font-bold">
                    ₹{(p.price || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </a>
            );
          })}
          {results.length === 0 && (
            <p className="text-[14px] text-[#6b7280] col-span-full py-6 text-center">
              {term ? `No products found for “${term}”.` : "Loading…"}
            </p>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div ref={rootRef} className={`relative w-full ${isHeader ? "h-full" : ""} ${className}`}>
      <div
        className={
          isHeader
            ? "flex items-center w-full h-full px-4 rounded-3xl border border-[#3056d3] bg-white"
            : "flex items-center h-[48px] px-4 rounded-full border border-[rgba(48,86,211,0.5)] bg-white"
        }
      >
        <span className="text-[#64748B] mr-2" aria-hidden="true">
          🔍
        </span>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={q}
          role="combobox"
          aria-label="Search products"
          aria-expanded={openPanel}
          aria-autocomplete="list"
          onChange={(e) => { setQ(e.target.value); setOpenPanel(true); }}
          onFocus={() => { if (swallowFocus.current) { swallowFocus.current = false; return; } setOpenPanel(true); }}
          // Tapping a field that autofocus already focused fires no focus
          // event, so without this the panel could never be summoned back.
          onClick={() => setOpenPanel(true)}
          onKeyDown={onKeyDown}
          // The header field is only ~200px wide at 320px, where the long
          // placeholder truncates mid-word.
          placeholder={isHeader ? "Search skincare…" : "Search for serums, sunscreen, ingredients…"}
          className="flex-1 min-w-0 outline-none text-[15px] bg-transparent"
        />
        {isHeader ? (
          <button
            type="button"
            onClick={() => submit()}
            className="text-[13px] font-bold text-[#3056D3] px-2 min-h-[44px]"
          >
            Search
          </button>
        ) : (
          <button
            type="button"
            aria-label="Close search"
            onClick={() => onDismiss?.()}
            className="text-[#6b7280] text-[20px] leading-none px-1 min-h-[44px]"
          >
            ×
          </button>
        )}
      </div>

      {isHeader
        ? openPanel && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[120] bg-white rounded-[16px] border border-[rgba(111,115,132,0.25)] shadow-[0_20px_60px_rgba(14,27,77,0.22)] p-4">
              {panel}
            </div>
          )
        : <div className="mt-4">{panel}</div>}
    </div>
  );
}
