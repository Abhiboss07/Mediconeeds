"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { addItem } from "@/lib/cart/store";

const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");

function Stars({ rating = 0, size = 13 }) {
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

// Compact product card used in the Similar / More-from-brand carousels.
function MiniCard({ p, w = "w-[160px]" }) {
  const disc = p.compareAt > p.price ? Math.round((1 - p.price / p.compareAt) * 100) : p.discount || 0;
  return (
    <div className={`${w} shrink-0 snap-start bg-white rounded-lg border border-[#e6e9f2] p-2.5 relative`}>
      <a href={"/products/" + p.slug} className="block">
        <div className="aspect-square w-full bg-white flex items-center justify-center"><img src={p.image} alt={p.title} loading="lazy" className="w-full h-full object-contain max-h-[120px]" /></div>
      </a>
      <div className="flex items-center gap-1 mt-1"><Stars rating={p.rating || 4} size={11} /><span className="text-[11px] text-[#6b7280]">({(p.rating || 4).toFixed(1)})</span></div>
      <a href={"/products/" + p.slug} className="block text-[12px] text-[#182a54] leading-[15px] line-clamp-2 min-h-[30px] mt-0.5 hover:text-[#3056d3]">{p.title}</a>
      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-[13px] font-bold text-[#182a54]">{inr(p.price)}</span>
        {p.compareAt > p.price && <span className="text-[10.5px] text-[#a0abbb] line-through">{inr(p.compareAt)}</span>}
        {disc > 0 && <span className="text-[10.5px] font-semibold text-[#e0633a]">{disc}% OFF</span>}
      </div>
    </div>
  );
}

function Carousel({ items, w }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * 340, behavior: "smooth" });
  return (
    <div className="relative">
      <div ref={ref} className="flex gap-3 overflow-x-auto mn-noscroll snap-x pb-1 scroll-smooth">
        {items.map((p) => <MiniCard key={p.slug || p.id} p={p} w={w} />)}
      </div>
      {items.length > 4 && (
        <>
          <button onClick={() => scroll(-1)} aria-label="Previous" className="hidden lg:flex absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[#e2e7f9] shadow items-center justify-center text-[#182a54]">‹</button>
          <button onClick={() => scroll(1)} aria-label="Next" className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-[#e2e7f9] shadow items-center justify-center text-[#182a54]">›</button>
        </>
      )}
    </div>
  );
}

const ADVANTAGES = [
  ["M3 7h13v10H3zM16 10h3l3 3v4h-6", "Free delivery"],
  ["M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.7 3M3 4v4h4", "7-day replacement"],
  ["M9 12l2 2 4-4M12 3l7 4v5a9 9 0 0 1-14 4", "Hassle free"],
  ["M20 7 9 18l-5-5", "Shelf-life guarantee"],
  ["M2 7h20v10H2zM2 11h20", "COD available"],
  ["M5 12h14M12 5l7 7-7 7", "Free shipping"],
];

export default function ProductView({ product, similar = [], brandProducts = [] }) {
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
  const [delivery, setDelivery] = useState("in 2–4 business days");

  const v = variants[variant] || variants[0];
  const price = v.price ?? product.price;
  const mrp = v.compareAt || product.compareAt || 0;
  const discount = mrp > price ? Math.round((1 - price / mrp) * 100) : product.discount || 0;
  const rating = product.rating || 4.5;
  const reviews = product.reviews || 24;
  const inStock = product.stock > 0 || v.available;
  const mainImg = images[active] || product.image;
  const couponPrice = Math.round(price * 0.97);

  useEffect(() => {
    try { setWish(JSON.parse(localStorage.getItem("mn_wishlist") || "[]").includes(product.slug)); } catch {}
    const d = new Date(); d.setDate(d.getDate() + 4);
    setDelivery("by " + d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
  }, [product.slug]);

  const addCart = () => {
    addItem({ id: product.id || product.slug, slug: product.slug, name: product.title, image: product.image, price, sku: v.sku }, qty);
    setAdded(true); setTimeout(() => setAdded(false), 1500);
  };
  const buyNow = () => { addCart(); router.push("/checkout"); };
  const toggleWish = () => setWish((w) => {
    try { const list = JSON.parse(localStorage.getItem("mn_wishlist") || "[]"); localStorage.setItem("mn_wishlist", JSON.stringify(w ? list.filter((s) => s !== product.slug) : [...new Set([...list, product.slug])])); } catch {}
    return !w;
  });
  const share = async () => { try { const url = window.location.href; if (navigator.share) await navigator.share({ title: product.title, url }); else await navigator.clipboard.writeText(url); } catch {} };
  const copyCoupon = async () => { try { await navigator.clipboard.writeText("MEDIFIRST"); } catch {} };
  const onMove = (e) => { const r = e.currentTarget.getBoundingClientRect(); setZoom({ on: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); };

  const highlights = (product.tags || []).map((t) => t.charAt(0).toUpperCase() + t.slice(1));
  const specs = [
    ["Brand", product.brand], ["Product type", product.productType || product.categoryName], ["Category", product.categoryName],
    ["SKU", v.sku], v.barcode ? ["Barcode / GTIN", v.barcode] : null, v.grams ? ["Weight", `${v.grams} g`] : null,
    product.ingredient ? ["Key ingredient", product.ingredient] : null, product.skinTypes ? ["Suitable for", product.skinTypes] : null,
    ["Country of origin", "India"], ["Payment", "Prepaid & Cash on Delivery"],
  ].filter(Boolean);
  const boxItems = variants.length > 1 ? variants.map((x) => `1 × ${product.title} (${x.title})`).join(", ") : `1 × ${product.title}`;
  const faqs = [
    { q: `Is ${product.title} in stock?`, a: inStock ? `Yes — currently ${product.stock} unit${product.stock === 1 ? "" : "s"} available and ready to ship.` : "Currently out of stock. Request a bulk quote for availability updates." },
    variants.length > 1 ? { q: "What variants are available?", a: `Available options: ${variants.map((x) => x.title).join(", ")}.` } : null,
    { q: "Do you offer Cash on Delivery?", a: "Yes, both prepaid and Cash on Delivery are supported at checkout." },
    { q: "Can I order in bulk?", a: "Yes. Use Request bulk quote for volume pricing and GST invoicing." },
    { q: "What is the return policy?", a: "Unopened items in original packaging are eligible for return as per our returns policy." },
  ].filter(Boolean);
  const emi = Math.max(1, Math.round((price * 1.03) / 6));
  const subtotal = price * qty;

  const TABS = [["description", "Description"], ["specs", "Key Specification & Dimensions"], ["direction", "Direction to Use"], ["warranty", "Warranty"], ["faq", "FAQs"]];

  return (
    <div className="bg-white">
      <div className="max-w-[80rem] mx-auto px-3 lg:px-5 py-3">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-[11.5px] text-[#8a93a6] mb-2 truncate">
          <a href="/" className="hover:text-[#3056d3]">Home</a> <span className="mx-1">›</span>
          <a href="/products" className="hover:text-[#3056d3]">Shop</a>
          {product.categoryName && <><span className="mx-1">›</span><a href={`/products?category=${encodeURIComponent(product.categoryName)}`} className="hover:text-[#3056d3]">{product.categoryName}</a></>}
          <span className="mx-1">›</span><span className="text-[#3056d3]">{product.title}</span>
        </nav>

        {/* Offer strip */}
        <div className="rounded-md bg-gradient-to-r from-[#2a4689] to-[#3056d3] text-white text-[12.5px] font-semibold text-center py-2 mb-3">
          Free shipping over ₹999 · Extra savings on bulk orders — use code <b>MEDIFIRST</b>
        </div>

        <div className="pdp-grid">
          {/* ══ LEFT: Gallery + Advantages ══ */}
          <div className="pdp-left">
            <div className="bg-white rounded-lg border border-[#e6e9f2] p-3">
              <div className="relative">
                <div className="absolute top-2 right-2 z-10 flex flex-col gap-2">
                  <button onClick={share} aria-label="Share" className="w-8 h-8 rounded-full bg-white shadow-sm border border-[#e6e9f2] flex items-center justify-center text-[#8a93a6]"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" /></svg></button>
                  <button onClick={toggleWish} aria-label="Wishlist" className="w-8 h-8 rounded-full bg-white shadow-sm border border-[#e6e9f2] flex items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill={wish ? "#ff4b77" : "none"} stroke={wish ? "#ff4b77" : "#8a93a6"} strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg></button>
                  <button onClick={() => setModal(true)} aria-label="Expand" className="w-8 h-8 rounded-full bg-white shadow-sm border border-[#e6e9f2] flex items-center justify-center text-[#8a93a6]"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H3v5M21 8V3h-5M16 21h5v-5M3 16v5h5" /></svg></button>
                </div>
                {discount > 0 && <span className="absolute top-2 left-2 z-10 bg-[#e0633a] text-white text-[11px] font-bold px-2 py-0.5 rounded">{discount}% Off</span>}
                <div className="aspect-square w-full rounded-md bg-white overflow-hidden cursor-zoom-in flex items-center justify-center" onMouseMove={onMove} onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))} onClick={() => setModal(true)}>
                  <img src={mainImg} alt={product.title} draggable="false" className="w-full h-full object-contain p-6 transition-transform duration-150" style={zoom.on ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined} />
                </div>
                <button onClick={() => setModal(true)} className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-white border border-[#e6e9f2] shadow-sm rounded-md px-3 py-1.5 text-[12px] font-semibold text-[#3056d3]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>Download Brochure
                </button>
              </div>
              {/* thumbnails (horizontal) */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto mn-noscroll">
                  {images.map((img, i) => (
                    <button key={img + i} onMouseEnter={() => setActive(i)} onClick={() => setActive(i)} className={`w-[56px] h-[56px] rounded-md bg-white border p-1 shrink-0 flex items-center justify-center ${active === i ? "border-[#3056d3]" : "border-[#e6e9f2] hover:border-[#a0abbb]"}`}>
                      <img src={img} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Your Advantages */}
            <div className="mt-3">
              <h3 className="text-[13px] font-bold text-[#182a54] mb-2">Your Advantages</h3>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                {ADVANTAGES.map(([d, label]) => (
                  <div key={label} className="flex items-center gap-2 text-[11px] font-semibold text-[#6b7280] uppercase tracking-wide">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3056d3" strokeWidth="1.7" className="shrink-0"><path d={d} /></svg>{label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══ CENTER: Info ══ */}
          <div className="pdp-center">
            {product.brand && <a href={`/products?q=${encodeURIComponent(product.brand)}`} className="text-[12px] font-semibold text-[#3056d3] hover:underline">{product.brand}</a>}
            <h1 className="text-[20px] lg:text-[23px] font-bold text-[#182a54] leading-snug mt-0.5">{product.title}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-[#182a54]"><Stars rating={rating} /><b className="text-[12.5px]">{rating.toFixed(1)}/5</b></span>
              <a href="#reviews" className="text-[12px] text-[#8a93a6] uppercase tracking-wide">({reviews} reviews)</a>
            </div>

            <div className="flex items-center gap-2.5 mt-3 flex-wrap">
              <span className="text-[26px] font-extrabold text-[#3056d3] leading-none">{inr(price)}</span>
              {mrp > price && <span className="text-[14px] text-[#a0abbb] line-through">{inr(mrp)}</span>}
              {discount > 0 && <span className="text-[13px] font-bold text-[#e0633a]">{discount}% Off</span>}
            </div>
            <p className="text-[11.5px] text-[#8a93a6] mt-1">Inclusive of all taxes (GST)</p>

            {/* Coupon strip */}
            <div className="mt-2.5 inline-flex items-center gap-2 bg-[#fff4ea] border border-dashed border-[#ff8c00] rounded-md px-2.5 py-1.5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff8c00" strokeWidth="2"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6M2 7h20v5H2zM12 22V7" /></svg>
              <span className="text-[12px] text-[#182a54]">Get it for <b className="text-[#e0633a]">{inr(couponPrice)}</b> with <b>MEDIFIRST</b></span>
              <button onClick={copyCoupon} aria-label="Copy code" className="text-[#3056d3]"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg></button>
            </div>

            {/* Variant selector */}
            {variants.length > 1 && (
              <div className="mt-4">
                <span className="text-[12.5px] font-bold text-[#182a54]">Options</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {variants.map((x, i) => (
                    <button key={x.sku || i} onClick={() => setVariant(i)} className={`min-w-[52px] h-9 px-3 rounded-md text-[12.5px] font-semibold ${variant === i ? "bg-[#3056d3] text-white border border-[#3056d3]" : "bg-white border border-[#d5dbeb] text-[#374151] hover:border-[#3056d3]"}`}>{x.title}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="mt-3 flex items-center gap-2 text-[12.5px] font-semibold">
              <span className={`inline-flex w-2 h-2 rounded-full ${inStock ? "bg-[#1e7a5a]" : "bg-[#d23f3f]"}`} />
              {inStock ? <span className="text-[#1e7a5a]">In stock{product.stock > 0 ? ` · ${product.stock} available` : ""}</span> : <span className="text-[#d23f3f]">Out of stock</span>}
            </div>

            {/* Similar Products carousel */}
            {similar.length > 0 && (
              <div className="mt-4 rounded-lg bg-[#eef3ff] border border-[#dbe4ff] p-3">
                <h3 className="text-[14px] font-bold text-[#182a54] mb-2.5">Similar Products</h3>
                <Carousel items={similar} w="w-[150px]" />
              </div>
            )}
          </div>

          {/* ══ RIGHT: Purchase card ══ */}
          <div className="pdp-right space-y-3">
            <div className="bg-white rounded-lg border border-[#e6e9f2] p-3.5">
              <div className="flex items-center justify-between text-[12px] pb-2.5 border-b border-[#f0f2f8]">
                <span className="text-[#374151]">Delivery <b className="text-[#182a54]">{delivery}</b></span>
                <span className="text-[#8a93a6]">📍 <button className="text-[#3056d3] font-semibold">Change</button></span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-[13px] font-semibold text-[#182a54]">Subtotal :</span>
                <span className="text-[18px] font-extrabold text-[#182a54]">{inr(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-[#d5dbeb] h-10 overflow-hidden mb-3">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-10 text-[#182a54] text-[18px] font-bold hover:bg-[#f7f8fd]">−</button>
                <span className="text-[14px] font-bold text-[#182a54]">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-11 h-10 text-[#182a54] text-[18px] font-bold hover:bg-[#f7f8fd]">+</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={addCart} disabled={!inStock} className={`h-10 rounded-md text-[13px] font-bold border transition-colors disabled:opacity-50 disabled:pointer-events-none ${added ? "bg-[#1e7a5a] text-white border-[#1e7a5a]" : "bg-white text-[#3056d3] border-[#3056d3] hover:bg-[#eef2ff]"}`}>{added ? "Added ✓" : "Add to cart"}</button>
                <button onClick={buyNow} disabled={!inStock} className="h-10 rounded-md bg-[#3056d3] text-white text-[13px] font-bold hover:bg-[#2546b8] transition-colors disabled:opacity-50 disabled:pointer-events-none">Buy Now</button>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#f0f2f8]">
                <span className="text-[12px] text-[#374151]">Want to buy bulk quantity?</span>
                <a href="/export#enquiry" className="text-[12px] font-bold text-[#3056d3] border border-[#3056d3] rounded-md px-2.5 py-1.5 hover:bg-[#eef2ff]">Get Bulk Quote</a>
              </div>
            </div>

            {/* NO COST EMI banner */}
            <div className="rounded-lg overflow-hidden bg-gradient-to-br from-[#182a54] to-[#3056d3] text-white p-3.5">
              <div className="text-[15px] font-extrabold">NO COST EMI</div>
              <div className="text-[11.5px] opacity-90">Available across leading banks and cards</div>
              <div className="flex gap-2 mt-2 text-[10px] opacity-90"><span>0% Interest</span><span>·</span><span>Easy installments</span><span>·</span><span>Flexible tenure</span></div>
            </div>

            {/* Purchase with Credit */}
            <div className="bg-white rounded-lg border border-[#e6e9f2] p-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9747ff" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>
                <div>
                  <div className="text-[12.5px] font-bold text-[#182a54]">Purchase with Credit</div>
                  <div className="text-[11px] text-[#8a93a6]">Interest-free credit with easy approval · EMI from {inr(emi)}/mo</div>
                </div>
              </div>
              <a href="/export#enquiry" className="text-[11px] font-bold text-[#3056d3] whitespace-nowrap">APPLY NOW ›</a>
            </div>

            {/* Report / feedback */}
            <div className="bg-white rounded-lg border border-[#e6e9f2] p-3.5">
              <a href="#reviews" className="text-[12.5px] font-semibold text-[#182a54] hover:text-[#3056d3]">Share your thoughts on this product ›</a>
              <p className="text-[11px] text-[#8a93a6] mt-1">Incorrect prices? Missing information? Delivery time too high? <a href="/contact" className="text-[#3056d3]">Let us know</a>.</p>
            </div>
          </div>
        </div>

        {/* ══ Tabs ══ */}
        <div className="mt-5 border-b border-[#e6e9f2]">
          <div className="flex gap-6 overflow-x-auto mn-noscroll">
            {TABS.map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap py-2.5 text-[13.5px] font-semibold border-b-2 -mb-px transition-colors ${tab === id ? "border-[#e0633a] text-[#182a54]" : "border-transparent text-[#8a93a6] hover:text-[#182a54]"}`}>{label}</button>
            ))}
          </div>
        </div>

        <div className="py-5">
          {tab === "description" && (
            <div className="space-y-6">
              {/* feature image */}
              <div className="rounded-lg overflow-hidden bg-[#f4f6fb] border border-[#e6e9f2] flex items-center justify-center h-[240px] lg:h-[280px]">
                <img src={mainImg} alt={product.title} className="max-h-[220px] object-contain" />
              </div>
              {product.brand && <p className="text-[13px] text-[#374151]">Brand <a href={`/products?q=${encodeURIComponent(product.brand)}`} className="text-[#3056d3] font-semibold hover:underline">{product.brand}</a></p>}
              {/* What's in the Box */}
              <div className="flex items-start gap-3 bg-[#f7f8fd] border border-[#e6e9f2] rounded-lg p-4">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3056d3" strokeWidth="1.6" className="shrink-0"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><path d="M3.3 7 12 12l8.7-5M12 22V12" /></svg>
                <div><div className="text-[14px] font-bold text-[#182a54]">What's in the Box</div><p className="text-[13px] text-[#6b7280] mt-0.5">{boxItems}</p></div>
              </div>
              {/* long HTML description */}
              {product.descriptionHtml
                ? <div className="prose prose-sm max-w-none text-[#374151] text-[14px] leading-[1.7]" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
                : <p className="text-[14px] text-[#374151] leading-[1.7]">{product.shortDesc || `${product.title} — a dermatologist-formulated ${product.categoryName || "skincare"} product supplied through the Mediconeeds marketplace.`}</p>}
              {/* Key Features */}
              {highlights.length > 0 && (
                <div>
                  <h3 className="text-[15px] font-bold text-[#182a54] mb-2">Key Features :</h3>
                  <ul className="space-y-1.5">
                    {highlights.map((h) => (<li key={h} className="flex items-start gap-2 text-[13.5px] text-[#374151]"><span className="text-[#3056d3] mt-0.5">•</span>{h}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {tab === "specs" && (
            <div className="grid sm:grid-cols-2 gap-x-10 max-w-[900px]">
              {specs.map(([k, val]) => (<div key={k} className="flex justify-between gap-4 py-2.5 text-[13px] border-b border-[#f0f2f8]"><span className="text-[#8a93a6]">{k}</span><span className="text-[#182a54] font-semibold text-right">{val || "—"}</span></div>))}
            </div>
          )}
          {tab === "direction" && (
            <div className="text-[14px] text-[#374151] leading-[1.7] space-y-2 max-w-[820px]">
              <p>Follow the usage guidance printed on the product packaging. For {product.categoryName || "skincare"} products, patch-test before first use and apply as directed.</p>
              <p>For clinical or professional use, follow your institution's protocol. Consult a qualified professional if you have specific medical concerns.</p>
            </div>
          )}
          {tab === "warranty" && (
            <div className="text-[14px] text-[#374151] leading-[1.7] space-y-2 max-w-[820px]">
              <p><b className="text-[#182a54]">{product.brand || "Dr Awish"}</b> products supplied via Mediconeeds are 100% genuine and sourced from verified sellers.</p>
              <p>Standard manufacturer warranty and shelf-life apply where applicable. Damaged or defective items are covered under our <a href="/policy/returns" className="text-[#3056d3] hover:underline">Returns &amp; Refunds</a> policy.</p>
            </div>
          )}
          {tab === "faq" && (
            <div id="reviews" className="divide-y divide-[#f0f2f8] max-w-[900px]">
              {faqs.map((f) => (
                <details key={f.q} className="group py-3">
                  <summary className="flex items-center justify-between cursor-pointer list-none text-[13.5px] font-semibold text-[#182a54]">{f.q}<span className="text-[#3056d3] text-[18px] leading-none group-open:rotate-45 transition-transform ml-3">+</span></summary>
                  <p className="text-[13px] text-[#6b7280] mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          )}
        </div>

        {/* ══ More from brand ══ */}
        {brandProducts.length > 0 && (
          <section className="mt-4 border-t border-[#e6e9f2] pt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-bold text-[#182a54]">More from {product.brand}</h2>
              <a href={`/products?q=${encodeURIComponent(product.brand)}`} className="text-[12.5px] font-semibold text-[#3056d3]">View All ›</a>
            </div>
            <Carousel items={brandProducts} w="w-[168px]" />
          </section>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-[300] bg-black/70 flex items-center justify-center p-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-lg max-w-[720px] w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-end"><button onClick={() => setModal(false)} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-[#f2f4fa] text-[#182a54] text-[22px] leading-none">×</button></div>
            <div className="aspect-square w-full flex items-center justify-center"><img src={mainImg} alt={product.title} className="max-w-full max-h-full object-contain" /></div>
            {images.length > 1 && <div className="flex gap-2 justify-center mt-3 flex-wrap">{images.map((img, i) => (<button key={img + i} onClick={() => setActive(i)} className={`w-14 h-14 rounded-md border p-1 ${active === i ? "border-[#3056d3]" : "border-[#e6e9f2]"}`}><img src={img} alt="" className="w-full h-full object-contain" /></button>))}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
