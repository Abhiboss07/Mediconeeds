"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addItem } from "@/lib/cart/store";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

function Stars({ rating = 0, size = 14 }) {
  return (
    <span className="inline-flex items-center" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i < Math.round(rating) ? "#ffb400" : "#dfe3ec"} aria-hidden="true">
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </span>
  );
}

const RECENT_KEY = "mn_recently_viewed";

export default function ProductView({ product, related }) {
  const router = useRouter();
  const images = product.images && product.images.length ? product.images : [product.image].filter(Boolean);
  const variants = product.variants && product.variants.length ? product.variants : [{ title: "Standard", price: product.price, sku: "", available: product.stock > 0 }];

  const [active, setActive] = useState(0);
  const [variant, setVariant] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState("description");
  const [wish, setWish] = useState(false);
  const [modal, setModal] = useState(false);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const [pin, setPin] = useState("");
  const [eta, setEta] = useState("");
  const [recent, setRecent] = useState([]);

  const v = variants[variant] || variants[0];
  const price = v.price ?? product.price;
  const mrp = v.compareAt || product.compareAt || 0;
  const discount = mrp > price ? Math.round((1 - price / mrp) * 100) : product.discount || 0;
  const rating = product.rating || 0;
  const reviews = product.reviews || 0;
  const inStock = product.stock > 0 || v.available;
  const mainImg = images[active] || product.image;

  // Recently viewed (client-only → identical initial server/client render, no hydration mismatch)
  useEffect(() => {
    try {
      const prev = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      setRecent(prev.filter((r) => r.slug !== product.slug).slice(0, 6));
      const next = [{ slug: product.slug, title: product.title, image: product.image, price: product.price }, ...prev.filter((r) => r.slug !== product.slug)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      setWish(JSON.parse(localStorage.getItem("mn_wishlist") || "[]").includes(product.slug));
    } catch {}
  }, [product.slug]);

  const addCart = () => {
    addItem({ id: product.id || product.slug, slug: product.slug, name: product.title, image: product.image, price, sku: v.sku }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  const buyNow = () => { addCart(); router.push("/checkout"); };
  const toggleWish = () => {
    setWish((w) => {
      try {
        const list = JSON.parse(localStorage.getItem("mn_wishlist") || "[]");
        const next = w ? list.filter((s) => s !== product.slug) : [...new Set([...list, product.slug])];
        localStorage.setItem("mn_wishlist", JSON.stringify(next));
      } catch {}
      return !w;
    });
  };
  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try { if (navigator.share) await navigator.share({ title: product.title, url }); else await navigator.clipboard.writeText(url); } catch {}
  };
  const checkPin = () => {
    if (!/^\d{6}$/.test(pin)) { setEta("Enter a valid 6-digit PIN"); return; }
    const d = new Date(); d.setDate(d.getDate() + 4);
    setEta("Delivery by " + d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
  };
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ on: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  const highlights = (product.tags || []).slice(0, 6);
  const specs = [
    ["Brand", product.brand],
    ["Product type", product.productType || product.categoryName],
    ["Category", product.categoryName],
    ["SKU", v.sku],
    v.barcode ? ["Barcode / GTIN", v.barcode] : null,
    v.grams ? ["Weight", `${v.grams} g`] : null,
    product.ingredient ? ["Key ingredient", product.ingredient] : null,
    product.skinTypes ? ["Suitable for", product.skinTypes] : null,
    ["Country of origin", "India"],
    ["Payment", "Prepaid & Cash on Delivery"],
  ].filter(Boolean);

  const faqs = [
    { q: `Is ${product.title} in stock?`, a: inStock ? `Yes — currently ${product.stock} unit${product.stock === 1 ? "" : "s"} available and ready to ship.` : "This item is currently out of stock. Request a bulk quote and we'll update you on availability." },
    variants.length > 1 ? { q: "What variants are available?", a: `Available options: ${variants.map((x) => x.title).join(", ")}.` } : null,
    { q: "Do you offer Cash on Delivery?", a: "Yes, both prepaid and Cash on Delivery are supported at checkout." },
    { q: "Can I order in bulk for my clinic or pharmacy?", a: "Yes. Use the Request bulk quote option for volume pricing and GST invoicing." },
    { q: "What is the return policy?", a: "Unopened items in original packaging are eligible for return as per our returns policy." },
  ].filter(Boolean);

  const emi = Math.max(1, Math.round((price * 1.03) / 6));

  const TABS = [
    ["description", "Description"],
    ["specifications", "Specifications"],
    ["direction", "Direction to Use"],
    ["warranty", "Warranty"],
    ["faq", "FAQs"],
  ];

  return (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-6 py-4 lg:py-6 bg-[#f7f8fd] min-h-screen">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[12px] text-[#6b7280] mb-3">
        <a href="/" className="hover:text-[#3056d3]">Home</a> <span className="mx-1.5 opacity-50">/</span>
        <a href="/products" className="hover:text-[#3056d3]">Shop</a>
        {product.categoryName && (<><span className="mx-1.5 opacity-50">/</span><a href={`/products?category=${encodeURIComponent(product.categoryName)}`} className="hover:text-[#3056d3]">{product.categoryName}</a></>)}
        <span className="mx-1.5 opacity-50">/</span><span className="text-[#182a54] font-semibold">{product.title}</span>
      </nav>

      <div className="pdp-grid">
        {/* ── LEFT: Gallery ── */}
        <div className="pdp-left lg:sticky lg:top-4">
          <div className="bg-white rounded-xl border border-[#e2e7f9] p-3">
            <div className="flex gap-3">
              <div className="flex flex-col gap-2 w-[58px] shrink-0 max-h-[420px] overflow-y-auto">
                {images.map((img, i) => (
                  <button key={img + i} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)}
                    className={`w-[54px] h-[54px] rounded-lg bg-[#f7f8fd] border p-1 shrink-0 flex items-center justify-center transition-all ${active === i ? "border-[#3056d3] ring-1 ring-[#3056d3]" : "border-[#e2e7f9] hover:border-[#a0abbb]"}`}>
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                  <button onClick={toggleWish} aria-label="Add to wishlist" className="w-9 h-9 rounded-full bg-white shadow border border-[#e2e7f9] flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={wish ? "#ff4b77" : "none"} stroke={wish ? "#ff4b77" : "#8a93a6"} strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
                  </button>
                  <button onClick={share} aria-label="Share" className="w-9 h-9 rounded-full bg-white shadow border border-[#e2e7f9] flex items-center justify-center text-[#8a93a6]">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>
                  </button>
                  <button onClick={() => setModal(true)} aria-label="Fullscreen" className="w-9 h-9 rounded-full bg-white shadow border border-[#e2e7f9] flex items-center justify-center text-[#8a93a6]">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H3v5M21 8V3h-5M16 21h5v-5M3 16v5h5" /></svg>
                  </button>
                </div>
                {discount > 0 && <span className="absolute top-2 left-2 z-10 bg-[#ff4b77] text-white text-[11px] font-bold px-2 py-1 rounded">{discount}% OFF</span>}
                <div className="aspect-square w-full rounded-lg bg-white overflow-hidden cursor-zoom-in flex items-center justify-center"
                  onMouseMove={onMove} onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))} onClick={() => setModal(true)}>
                  <img src={mainImg} alt={product.title} draggable="false"
                    className="w-full h-full object-contain p-4 transition-transform duration-150"
                    style={zoom.on ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#a0abbb] text-center mt-2">Roll over image to zoom · click to expand</p>
          </div>
        </div>

        {/* ── CENTER: Info ── */}
        <div className="pdp-center">
          <div className="bg-white rounded-xl border border-[#e2e7f9] p-4 lg:p-5">
            {product.brand && <a href={`/products?q=${encodeURIComponent(product.brand)}`} className="text-[12px] font-bold text-[#3056d3] hover:underline">{product.brand}</a>}
            <h1 className="text-[19px] lg:text-[22px] font-bold text-[#182a54] leading-snug mt-0.5">{product.title}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 bg-[#f0f7f0] text-[#1e7a5a] rounded px-1.5 py-0.5"><Stars rating={rating || 4.5} size={12} /><b className="text-[12px]">{(rating || 4.5).toFixed(1)}</b></span>
              <a href="#faq" className="text-[12px] text-[#3056d3] hover:underline">{reviews || 24} reviews</a>
              <span className="text-[12px] text-[#a0abbb]">|</span>
              <span className="text-[12px] text-[#8a93a6]">SKU: <b className="text-[#182a54]">{v.sku || "—"}</b></span>
            </div>

            {/* Price */}
            <div className="mt-3 pt-3 border-t border-[#eef1f8]">
              <div className="flex items-end gap-2.5 flex-wrap">
                <span className="text-[28px] font-extrabold text-[#182a54] leading-none">{inr(price)}</span>
                {mrp > price && <span className="text-[15px] text-[#a0abbb] line-through pb-0.5">{inr(mrp)}</span>}
                {discount > 0 && <span className="text-[13px] font-bold text-[#1e7a5a] pb-0.5">{discount}% off</span>}
              </div>
              <p className="text-[11px] text-[#8a93a6] mt-1">Inclusive of all taxes (GST)</p>
            </div>

            {/* Offer badges + coupon */}
            <div className="flex flex-wrap gap-2 mt-3">
              {product.cod && <span className="text-[11px] font-semibold bg-[#e2e7f9] text-[#2a4689] rounded px-2 py-1">COD available</span>}
              <span className="text-[11px] font-semibold bg-[#fff3e0] text-[#ff8c00] rounded px-2 py-1">Free shipping over ₹999</span>
              {discount > 0 && <span className="text-[11px] font-semibold bg-[#fdecef] text-[#ff4b77] rounded px-2 py-1">Save {inr(mrp - price)}</span>}
            </div>
            <div className="mt-3 flex items-center gap-2 border border-dashed border-[#ff8c00] bg-[#fff8ef] rounded-lg px-3 py-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" strokeWidth="2"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
              <span className="text-[12px] text-[#182a54]"><b>Bulk savings</b> — request a quote for volume pricing &amp; GST invoicing.</span>
            </div>

            {/* Delivery */}
            <div className="mt-3 flex items-center gap-2 text-[12.5px] text-[#374151]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e7a5a" strokeWidth="2"><path d="M20 8h-3V4H3a1 1 0 0 0-1 1v11h2M14 16H9M20 16h2v-3.3a2 2 0 0 0-.4-1.2L18.3 8H14v8" /></svg>
              Ships in <b className="text-[#182a54]">2–4 business days</b> across India
            </div>

            {/* Variants */}
            {variants.length > 1 && (
              <div className="mt-4">
                <span className="text-[12px] font-bold text-[#182a54]">Options</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {variants.map((x, i) => (
                    <button key={x.sku || i} onClick={() => setVariant(i)}
                      className={`h-9 px-3 rounded-lg text-[12.5px] font-semibold transition-all ${variant === i ? "bg-[#eef2ff] border border-[#3056d3] text-[#3056d3]" : "bg-white border border-[#e2e7f9] text-[#374151] hover:border-[#a0abbb]"}`}>
                      {x.title} · {inr(x.price)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="mt-3 flex items-center gap-2 text-[12.5px] font-semibold">
              <span className={`inline-flex w-2 h-2 rounded-full ${inStock ? "bg-[#1e7a5a]" : "bg-[#d23f3f]"}`} />
              {inStock ? <span className="text-[#1e7a5a]">In stock{product.stock > 0 ? ` · ${product.stock} available` : ""}</span> : <span className="text-[#d23f3f]">Out of stock</span>}
            </div>

            {/* Key highlights */}
            {highlights.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#eef1f8]">
                <h3 className="text-[13px] font-bold text-[#182a54] mb-2">Key highlights</h3>
                <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-[12.5px] text-[#374151] capitalize">
                      <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3056d3" strokeWidth="2.5"><path d="m5 13 4 4L19 7" /></svg>{h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Purchase card ── */}
        <div className="pdp-right lg:sticky lg:top-4 space-y-3">
          <div className="bg-white rounded-xl border border-[#e2e7f9] p-4">
            <div className="text-[20px] font-extrabold text-[#182a54]">{inr(price)}</div>
            <p className="text-[11px] text-[#8a93a6] mb-3">Inclusive of all taxes</p>

            <label className="text-[12px] font-semibold text-[#182a54]">Deliver to</label>
            <div className="flex gap-2 mt-1 mb-3">
              <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter PIN code"
                className="flex-1 h-9 px-3 rounded-lg border border-[#e2e7f9] text-[13px] outline-none focus:border-[#3056d3]" inputMode="numeric" />
              <button onClick={checkPin} className="h-9 px-3 rounded-lg bg-[#eef2ff] text-[#3056d3] text-[12px] font-bold">Check</button>
            </div>
            {eta && <p className="text-[12px] font-semibold text-[#1e7a5a] -mt-2 mb-3">{eta}</p>}

            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-[#182a54]">Quantity</span>
              <div className="flex items-center rounded-lg border border-[#e2e7f9] h-9 overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 text-[#182a54] font-bold hover:bg-[#f7f8fd]">−</button>
                <span className="w-9 text-center text-[13px] font-bold text-[#182a54]">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-9 h-9 text-[#182a54] font-bold hover:bg-[#f7f8fd]">+</button>
              </div>
            </div>

            <button onClick={addCart} disabled={!inStock}
              className={`w-full h-11 rounded-lg text-[14px] font-bold transition-colors ${added ? "bg-[#1e7a5a] text-white" : "bg-[#3056d3] text-white hover:bg-[#2546b8]"} disabled:opacity-50 disabled:pointer-events-none`}>
              {added ? "Added to cart ✓" : "Add to Cart"}
            </button>
            <button onClick={buyNow} disabled={!inStock}
              className="w-full h-11 mt-2 rounded-lg bg-[#ff8c00] text-white text-[14px] font-bold hover:bg-[#e67e00] transition-colors disabled:opacity-50 disabled:pointer-events-none">
              Buy Now
            </button>
            <a href="/export#enquiry" className="w-full h-11 mt-2 rounded-lg border border-[#3056d3] text-[#3056d3] text-[14px] font-bold flex items-center justify-center hover:bg-[#eef2ff] transition-colors">
              Request bulk quote
            </a>

            <ul className="mt-4 pt-3 border-t border-[#eef1f8] space-y-1.5 text-[11.5px] text-[#6b7280]">
              <li className="flex items-center gap-2"><span>🛡️</span> 100% genuine, verified sellers</li>
              <li className="flex items-center gap-2"><span>🔁</span> Easy returns on unopened items</li>
              <li className="flex items-center gap-2"><span>🔒</span> Secure payments · Razorpay</li>
            </ul>
          </div>

          {/* EMI / finance card */}
          <div className="bg-white rounded-xl border border-[#e2e7f9] p-4">
            <h3 className="text-[13px] font-bold text-[#182a54] flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9747ff" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
              EMI &amp; finance
            </h3>
            <p className="text-[12.5px] text-[#374151] mt-1.5">EMI from <b className="text-[#182a54]">{inr(emi)}/mo</b> on eligible cards &amp; pay-later at checkout.</p>
            <p className="text-[11px] text-[#a0abbb] mt-1">GST invoice provided on every order.</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="bg-white rounded-xl border border-[#e2e7f9] mt-4 lg:mt-6">
        <div className="flex gap-1 border-b border-[#eef1f8] px-2 overflow-x-auto">
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`whitespace-nowrap px-4 py-3 text-[13.5px] font-bold border-b-2 transition-colors ${tab === id ? "border-[#3056d3] text-[#3056d3]" : "border-transparent text-[#8a93a6] hover:text-[#182a54]"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="p-4 lg:p-6">
          {tab === "description" && (
            product.descriptionHtml
              ? <div className="prose prose-sm max-w-none text-[#374151] text-[14px] leading-relaxed" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
              : <p className="text-[14px] text-[#374151] leading-relaxed">{product.shortDesc || "A dermatologist-formulated Dr Awish product supplied through the Mediconeeds marketplace."}</p>
          )}
          {tab === "specifications" && (
            <div className="grid sm:grid-cols-2 gap-x-8">
              {specs.map(([k, val]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5 text-[13px] border-b border-[#f2f4fa]">
                  <span className="text-[#8a93a6]">{k}</span>
                  <span className="text-[#182a54] font-semibold text-right">{val || "—"}</span>
                </div>
              ))}
            </div>
          )}
          {tab === "direction" && (
            <div className="text-[14px] text-[#374151] leading-relaxed space-y-2">
              <p>Follow the usage guidance printed on the product packaging. For {product.categoryName || "skincare"} products, patch-test before first use and apply as directed.</p>
              <p>For clinical or professional use, follow your institution's protocol. Consult a qualified professional if you have specific medical concerns.</p>
            </div>
          )}
          {tab === "warranty" && (
            <div className="text-[14px] text-[#374151] leading-relaxed space-y-2">
              <p><b className="text-[#182a54]">{product.brand || "Dr Awish"}</b> products supplied via Mediconeeds are 100% genuine and sourced from verified sellers.</p>
              <p>Standard manufacturer warranty and shelf-life apply where applicable. Damaged or defective items are covered under our returns &amp; replacement policy — see <a href="/policy/returns" className="text-[#3056d3] hover:underline">Returns &amp; Refunds</a>.</p>
            </div>
          )}
          {tab === "faq" && (
            <div id="faq" className="divide-y divide-[#f2f4fa]">
              {faqs.map((f) => (
                <details key={f.q} className="group py-3">
                  <summary className="flex items-center justify-between cursor-pointer list-none text-[13.5px] font-semibold text-[#182a54]">
                    {f.q}<span className="text-[#3056d3] text-[18px] leading-none group-open:rotate-45 transition-transform ml-3">+</span>
                  </summary>
                  <p className="text-[13px] text-[#6b7280] mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Related ── */}
      {related && related.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[17px] lg:text-[19px] font-bold text-[#182a54] mb-3">Related products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {related.map((p) => <Card key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Recently viewed (client, localStorage) ── */}
      {recent.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[17px] lg:text-[19px] font-bold text-[#182a54] mb-3">Recently viewed</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recent.slice(0, 4).map((p) => <Card key={p.slug} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Image modal ── */}
      {modal && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-xl max-w-[720px] w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end">
              <button onClick={() => setModal(false)} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-[#f2f4fa] text-[#182a54] text-[22px] leading-none">×</button>
            </div>
            <div className="aspect-square w-full flex items-center justify-center"><img src={mainImg} alt={product.title} className="max-w-full max-h-full object-contain" /></div>
            {images.length > 1 && (
              <div className="flex gap-2 justify-center mt-3 flex-wrap">
                {images.map((img, i) => (
                  <button key={img + i} onClick={() => setActive(i)} className={`w-14 h-14 rounded-lg border p-1 ${active === i ? "border-[#3056d3]" : "border-[#e2e7f9]"}`}><img src={img} alt="" className="w-full h-full object-contain" /></button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ p }) {
  return (
    <a href={"/products/" + p.slug} className="bg-white rounded-xl border border-[#e2e7f9] p-3 hover:shadow-[0_8px_24px_rgba(14,27,77,0.08)] hover:border-[#a0abbb] transition-all flex flex-col">
      <div className="aspect-square w-full rounded-lg bg-[#f7f8fd] p-2 flex items-center justify-center"><img src={p.image} alt={p.title} loading="lazy" className="w-full h-full object-contain max-h-[150px]" /></div>
      {p.brand && <span className="text-[10.5px] font-bold text-[#8a93a6] uppercase truncate mt-2">{p.brand}</span>}
      <h3 className="text-[12.5px] font-semibold text-[#182a54] line-clamp-2 leading-[16px] min-h-[32px] mt-0.5">{p.title}</h3>
      <div className="flex items-baseline gap-2 mt-1.5">
        <span className="text-[14px] font-extrabold text-[#182a54]">{inr(p.price)}</span>
        {p.compareAt > p.price && <span className="text-[11px] text-[#a0abbb] line-through">{inr(p.compareAt)}</span>}
      </div>
    </a>
  );
}
