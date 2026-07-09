"use client";
import { useState } from "react";
import { addItem } from "@/lib/cart/store";

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

function Stars({ rating }) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-bold text-[#0e1b4d]">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < Math.floor(rating) ? "#F59E0B" : "#D1D5DB"} aria-hidden="true">
          <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
      <span className="ml-1 opacity-80">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function ProductView({ product, related }) {
  const [activeImage, setActiveImage] = useState(product.image || (product.images && product.images[0]) || "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  const primaryVariant = product.variants?.[0] || { sku: "", price: product.price, available: true };
  const [selectedVariant, setSelectedVariant] = useState(primaryVariant);

  const addCart = () => {
    addItem({
      id: product.id || product.slug,
      slug: product.slug,
      name: product.title,
      image: product.image,
      price: selectedVariant.price,
      sku: selectedVariant.sku,
    }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleVariantChange = (e) => {
    const idx = Number(e.target.value);
    const variant = product.variants[idx];
    if (variant) {
      setSelectedVariant(variant);
    }
  };

  return (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-6 lg:py-10">
      {/* Breadcrumbs */}
      <nav className="text-[12px] text-[#6b7280] mb-5">
        <a href="/" className="hover:text-[#3056D3]">Home</a>
        <span className="mx-2 opacity-50">/</span>
        <a href="/products" className="hover:text-[#3056D3]">Shop</a>
        <span className="mx-2 opacity-50">/</span>
        <span className="text-[#0e1b4d] font-semibold">{product.title}</span>
      </nav>

      {/* Main product view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white rounded-3xl border border-[rgba(111,115,132,0.15)] p-5 lg:p-8 hover:shadow-[0_12px_36px_rgba(14,27,77,0.06)] transition-all">
        {/* Left Column: Image gallery */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-2xl bg-[#fafbff] border border-[rgba(111,115,132,0.12)] p-4 flex items-center justify-center overflow-hidden">
            {product.discount > 0 && (
              <span className="absolute top-4 left-4 z-10 bg-[#e0633a] text-white text-[12px] font-extrabold px-3 py-1 rounded-full shadow-md">
                {product.discount}% OFF
              </span>
            )}
            <img src={activeImage} alt={product.title} className="w-full h-full object-contain max-h-[480px] transition-all hover:scale-105 duration-300" />
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-1 pr-1">
              {product.images.map((img) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(img)}
                  className={`w-[70px] h-[70px] rounded-xl bg-[#fafbff] border-2 flex items-center justify-center p-1.5 shrink-0 transition-all ${
                    activeImage === img ? "border-[#3056D3] shadow-sm scale-95" : "border-[rgba(111,115,132,0.18)] opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & actions */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div>
            {product.brand && (
              <span className="text-[12px] font-extrabold tracking-[0.15em] uppercase text-[#3056D3]">{product.brand}</span>
            )}
            <h1 className="text-[24px] lg:text-[32px] font-extrabold text-[#0e1b4d] leading-tight mt-1">{product.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <Stars rating={product.rating || 4.5} />
              <span className="text-[#6b7280] text-[13px] font-medium">({product.reviews || 24} customer reviews)</span>
            </div>
          </div>

          {/* Price & Discount */}
          <div className="bg-[#fafbff] rounded-2xl border border-[rgba(111,115,132,0.1)] p-4 flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-[26px] font-extrabold text-[#0e1b4d]">{inr(selectedVariant.price)}</span>
                {product.compareAt > selectedVariant.price && (
                  <span className="text-[16px] text-[#9ca3af] line-through font-medium">{inr(product.compareAt)}</span>
                )}
              </div>
              <span className="text-[11px] text-[#6b7280] font-semibold mt-1 block">Inclusive of all taxes</span>
            </div>
            {product.discount > 0 && (
              <div className="bg-[#fdece5] rounded-xl px-3 py-1.5 text-[#e0633a] font-extrabold text-[13px]">
                Save {inr(product.compareAt - selectedVariant.price)}
              </div>
            )}
          </div>

          {/* Category, Ingredient & Skin Types metadata tags */}
          <div className="flex flex-wrap gap-2 py-1">
            {product.categoryName && (
              <span className="text-[12px] font-semibold bg-[#eef2ff] text-[#3056D3] rounded-full px-3 py-1">Category: {product.categoryName}</span>
            )}
            {product.ingredient && (
              <span className="text-[12px] font-semibold bg-[#f5f3ff] text-[#6366f1] rounded-full px-3 py-1">Key Ingredient: {product.ingredient}</span>
            )}
            {product.skinTypes && (
              <span className="text-[12px] font-semibold bg-[#ecfdf5] text-[#059669] rounded-full px-3 py-1">Skin Type: {product.skinTypes}</span>
            )}
          </div>

          {/* Variants Selectors */}
          {product.variants && product.variants.length > 1 && (
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-bold text-[#0e1b4d]">Select Options</span>
              <select
                onChange={handleVariantChange}
                className="w-full h-[46px] px-3.5 rounded-xl border border-[rgba(111,115,132,0.4)] text-[14px] font-semibold text-[#0e1b4d] bg-white outline-none focus:border-[#3056D3] cursor-pointer"
              >
                {product.variants.map((v, idx) => (
                  <option key={v.sku || idx} value={idx}>
                    {v.title} — {inr(v.price)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Inventory and Shipping Info */}
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#1e7a5a]">
            <span className="inline-flex w-2.5 h-2.5 rounded-full bg-[#1e7a5a] animate-pulse"></span>
            {product.stock > 0 ? (
              <span>In Stock — ready to ship ({product.stock} items left)</span>
            ) : (
              <span className="text-[#d23f3f]">Out of Stock</span>
            )}
          </div>

          {/* Quantity selector & Add to cart */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <div className="flex items-center rounded-full border border-[rgba(111,115,132,0.4)] h-[46px] w-[120px] bg-white overflow-hidden justify-between p-1 shrink-0">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 rounded-full hover:bg-[#eef2ff] text-[#0e1b4d] font-bold flex items-center justify-center text-[18px] transition-colors"
              >
                −
              </button>
              <span className="text-[14px] font-bold text-[#0e1b4d]">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-8 h-8 rounded-full hover:bg-[#eef2ff] text-[#0e1b4d] font-bold flex items-center justify-center text-[18px] transition-colors"
              >
                +
              </button>
            </div>

            <button
              onClick={addCart}
              disabled={product.stock <= 0}
              className={`flex-1 h-[46px] rounded-full text-[14px] font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 shadow-sm ${
                added
                  ? "bg-[#1E7A5A] text-white border border-[#1E7A5A]"
                  : "bg-[#3056D3] text-white hover:bg-[#2546b8]"
              } disabled:opacity-50 disabled:pointer-events-none`}
            >
              {added ? "Added ✓" : "Add to Cart"}
            </button>
          </div>

          {/* Clinical assurance badges */}
          <div className="grid grid-cols-3 gap-2 border-t border-[rgba(111,115,132,0.15)] pt-5 mt-2 text-center text-[11px] font-bold text-[#6b7280] tracking-wide">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[18px]">🛡️</span>
              <span>100% Original</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[18px]">🚚</span>
              <span>Free Delivery</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[18px]">🧪</span>
              <span>Clinically Proven</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs section for description & specifications */}
      <div className="mt-8 bg-white rounded-3xl border border-[rgba(111,115,132,0.15)] p-5 lg:p-8">
        <div className="flex border-b border-[rgba(111,115,132,0.15)] mb-5">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-3 px-4 font-bold text-[14px] border-b-2 transition-colors ${
              activeTab === "description" ? "border-[#3056D3] text-[#3056D3]" : "border-transparent text-[#6b7280] hover:text-[#0e1b4d]"
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("specifications")}
            className={`pb-3 px-4 font-bold text-[14px] border-b-2 transition-colors ${
              activeTab === "specifications" ? "border-[#3056D3] text-[#3056D3]" : "border-transparent text-[#6b7280] hover:text-[#0e1b4d]"
            }`}
          >
            Details &amp; Specifications
          </button>
        </div>

        {activeTab === "description" ? (
          <div
            className="prose prose-sm max-w-none text-[#374151] leading-relaxed text-[14px]"
            dangerouslySetInnerHTML={{ __html: product.bodyHtml || "No description provided." }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] text-[#374151]">
            <div className="flex py-2 border-b border-[#f5f6fa]">
              <span className="font-semibold w-1/3 text-[#6b7280]">Brand</span>
              <span className="text-[#0e1b4d] font-bold">{product.brand || "Dr. Awish"}</span>
            </div>
            <div className="flex py-2 border-b border-[#f5f6fa]">
              <span className="font-semibold w-1/3 text-[#6b7280]">SKU</span>
              <span className="text-[#0e1b4d] font-bold">{selectedVariant.sku || "N/A"}</span>
            </div>
            <div className="flex py-2 border-b border-[#f5f6fa]">
              <span className="font-semibold w-1/3 text-[#6b7280]">Category</span>
              <span className="text-[#0e1b4d] font-bold">{product.categoryName || "Skincare"}</span>
            </div>
            <div className="flex py-2 border-b border-[#f5f6fa]">
              <span className="font-semibold w-1/3 text-[#6b7280]">COD Options</span>
              <span className="text-[#1e7a5a] font-bold">Available</span>
            </div>
          </div>
        )}
      </div>

      {/* Related Products Section */}
      {related && related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-[20px] lg:text-[24px] font-extrabold text-[#0e1b4d] mb-5">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <a
                key={p.id}
                href={"/products/" + p.slug}
                className="bg-white rounded-2xl border border-[rgba(111,115,132,0.15)] overflow-hidden hover:shadow-[0_8px_24px_rgba(14,27,77,0.06)] hover:-translate-y-0.5 transition-all p-3 flex flex-col gap-2"
              >
                <div className="aspect-square w-full rounded-xl bg-[#fafbff] p-2 flex items-center justify-center">
                  <img src={p.image} alt={p.title} className="w-full h-full object-contain max-h-[160px]" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-[#6b7280] uppercase truncate">{p.brand}</span>
                  <h3 className="text-[13px] font-bold text-[#0e1b4d] line-clamp-2 leading-[17px] min-h-[34px]">{p.title}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-[14px] font-extrabold text-[#0e1b4d]">{inr(p.price)}</span>
                    {p.compareAt > p.price && (
                      <span className="text-[11px] text-[#9ca3af] line-through">{inr(p.price)}</span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
