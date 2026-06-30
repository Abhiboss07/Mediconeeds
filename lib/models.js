// ============================================================================
// DATA MODELS — Phase-3-ready normalized shapes. These mirror Shopify Storefront
// API objects so Phase 3 can swap the data source (catalog.js → Storefront API)
// without changing the UI. All getters are pure and synchronous today; in
// Phase 3 they become async API calls returning the same shapes.
// ============================================================================
import { products as RAW, categories, ingredients, concerns, featuredCollections, fmtINR } from "@/lib/catalog";
import { site } from "@/lib/site";

// ---- Product model (≈ Shopify Product) ----
export function toProduct(p) {
  return {
    id: p.id,
    handle: p.slug,
    title: p.title,
    subtitle: p.subtitle || "",
    vendor: p.brand,
    productType: p.categoryName,
    tags: [p.category, p.ingredient, p.skinTypes].filter(Boolean),
    descriptionHtml: `<p>${p.shortDesc}</p>`,
    featuredImage: { url: p.image, altText: p.title },
    images: [{ url: p.image, altText: p.title }],
    priceRange: { minVariantPrice: { amount: p.price, currencyCode: "INR" } },
    compareAtPrice: { amount: p.compareAt, currencyCode: "INR" },
    discountPercent: p.discount,
    rating: { value: p.rating, count: p.reviews },
    availableForSale: true,
    options: [{ name: "Size", values: p.variants.map((v) => v.title) }],
    variants: p.variants.map((v, i) => ({
      id: `${p.id}-v${i}`, title: v.title,
      price: { amount: v.price, currencyCode: "INR" }, availableForSale: v.available,
    })),
    formatted: { price: fmtINR(p.price), compareAt: fmtINR(p.compareAt) },
  };
}

export const getAllProducts = () => RAW.map(toProduct);
export const getProduct = (handle) => {
  const p = RAW.find((x) => x.slug === handle) || RAW[0];
  return toProduct(p);
};
export const getProductsByCollection = (handle, limit) => {
  const fc = featuredCollections.find((c) => c.handle === handle);
  const list = handle === "all" ? RAW : RAW.filter((p) => p.category === handle);
  return (list.length ? list : RAW).slice(0, limit || 12).map(toProduct);
};

// ---- Collection model (≈ Shopify Collection) ----
export const getCollections = () =>
  categories.map((c) => ({ id: c.handle, handle: c.handle, title: c.name, color: c.color, image: `/catalog/cat-${c.handle}.svg` }));

// ---- Filter facets supported by current data (skincare) ----
export const getFilters = () => ({
  Category: categories.map((c) => c.name),
  "Skin Concern": concerns,
  Ingredient: ingredients.map((i) => i.name),
  "Product Type": ["Serum", "Cream", "Lotion", "Face Wash", "Sunscreen", "Shampoo", "Kit / Combo"],
  "Skin Type": ["Oily", "Dry", "Combination", "Sensitive", "Normal", "All"],
  Availability: ["In Stock", "On Sale", "New"],
  Rating: ["4★ & above", "4.5★ & above"],
});

// ---- Customer model (≈ Shopify Customer) — Phase 3 will hydrate from auth ----
export const emptyCustomer = () => ({
  id: null, firstName: "", lastName: "", email: "", phone: "",
  defaultAddress: null, addresses: [], orders: [], wishlist: [],
});

// ---- Cart model (≈ Shopify Cart) ----
export const emptyCart = () => ({ id: null, lines: [], subtotal: 0, currencyCode: "INR", checkoutUrl: "/checkout" });
export const cartLine = (product, variantId, qty = 1) => ({
  id: `${product.handle}-${variantId}`, quantity: qty,
  merchandise: { id: variantId, product },
});

// ---- Order model (≈ Shopify Order) ----
export const sampleOrders = () => [
  { id: "MN-10421", date: "12 Jun 2026", status: "Delivered", total: 1199, items: 3, image: "/drawish/ChatGPT_Image_Apr_16_2025_12_45_26_PM.png", title: "Dr Awish Glow Care Combo" },
  { id: "MN-10388", date: "28 May 2026", status: "Shipped", total: 649, items: 1, image: "/catalog/retinol-0-3-night-serum.svg", title: "Dr Awish Retinol Face Serum 30ml" },
  { id: "MN-10310", date: "09 May 2026", status: "Delivered", total: 999, items: 3, image: "/drawish/ChatGPT_Image_Apr_16_2025_01_19_37_PM.png", title: "Dr Awish Daily Essentials Kit" },
];

export { fmtINR, site };
