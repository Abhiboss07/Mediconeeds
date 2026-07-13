// ============================================================================
// Storefront catalogue — LIVE from MongoDB (CatalogProduct), queried at request
// time. Maps Shopify-shaped documents to the flat shape the storefront UI
// (ProductListing, SearchOverlay, PLP/offers/bestsellers) already expects, so
// no component markup changes are needed. Server-only.
// ============================================================================
import { dbConnect } from "@/lib/db/mongoose";
import { CatalogProduct } from "@/lib/db/models/CatalogProduct";

const stripHtml = (h) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// CatalogProduct document → flat storefront product (mirrors data/catalog shape).
export function mapToStorefront(doc) {
  const priceMin = doc.priceMin || (doc.variants?.[0]?.price ?? 0);
  const compareAt = doc.compareAtMax || 0;
  const discount = compareAt > priceMin && compareAt > 0 ? Math.round((1 - priceMin / compareAt) * 100) : 0;
  return {
    id: doc.handle,
    slug: doc.handle,
    handle: doc.handle,
    title: doc.title,
    subtitle: "",
    brand: doc.vendor || "",
    category: doc.category || "",
    categoryName: doc.categoryName || doc.productType || "",
    color: doc.color || "#3056D3",
    ingredient: doc.ingredient || "",
    price: priceMin,
    compareAt,
    discount,
    rating: doc.rating || 0,
    reviews: doc.reviews || 0,
    image: doc.image || doc.images?.[0]?.src || "",
    images: (doc.images || []).map((i) => i.src),
    variants: (doc.variants || []).map((v) => ({
      title: v.title || v.option1 || "Default",
      price: v.price,
      compareAt: v.compareAt || 0,
      sku: v.sku,
      barcode: v.barcode || "",
      grams: v.grams || 0,
      inventoryQty: v.inventoryQty ?? 0,
      available: v.inventoryQty > 0 || v.inventoryPolicy === "continue",
    })),
    options: doc.options || [],
    skinTypes: doc.skinTypes || "",
    productType: doc.productType || "",
    productCategory: doc.productCategory || "",
    tags: doc.tags || [],
    collections: doc.collections || [],
    stock: doc.totalInventory || 0,
    cod: true,
    descriptionHtml: doc.bodyHtml || "",
    shortDesc: doc.seo?.description || stripHtml(doc.bodyHtml).slice(0, 180),
  };
}

const liveFilter = { status: "active", published: true };

export async function getStorefrontProducts() {
  await dbConnect();
  const docs = await CatalogProduct.find(liveFilter).sort({ createdAt: 1 }).lean();
  return docs.map(mapToStorefront);
}

export async function getStorefrontProductByHandle(handle) {
  await dbConnect();
  const doc = await CatalogProduct.findOne({ handle, ...liveFilter }).lean();
  return doc ? mapToStorefront(doc) : null;
}

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/**
 * Real per-category counts for the storefront, computed with a Mongo aggregation
 * (GROUP BY categoryName, COUNT) over live published CatalogProducts — it does
 * NOT fetch every product. Only categories with ≥1 product are returned, so the
 * "Shop by Category" grid auto-adds a card the moment a product in a new
 * category goes live, and drops it when the last one is removed. `name` is what
 * the PLP category filter matches on; `slug` drives the icon.
 * @returns {Promise<Array<{name:string, slug:string, count:number, image:string, color:string}>>}
 */
export async function getCategoryCounts() {
  await dbConnect();
  const rows = await CatalogProduct.aggregate([
    { $match: liveFilter },
    { $group: {
      _id: { $ifNull: ["$categoryName", { $ifNull: ["$productType", "$category"] }] },
      count: { $sum: 1 },
      slug: { $first: "$category" },
      image: { $first: { $ifNull: ["$image", { $arrayElemAt: ["$images.src", 0] }] } },
      color: { $first: "$color" },
    } },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1, _id: 1 } },
  ]);
  return rows
    .filter((r) => String(r._id || "").trim())
    .map((r) => ({ name: String(r._id).trim(), slug: slugify(r.slug || r._id), count: r.count, image: r.image || "", color: r.color || "#3056D3" }));
}

/**
 * Real per-ingredient counts (aggregation). Unlike categories, the ingredient
 * section keeps its full taxonomy visible with the REAL live count for each —
 * ingredients with zero products still show ("0 products"), so the section is
 * never removed but never shows fake numbers. Links resolve to the PLP ingredient
 * filter.
 * @param {string[]} taxonomy ordered ingredient display names to always show
 */
export async function getIngredientCounts(taxonomy = []) {
  await dbConnect();
  const rows = await CatalogProduct.aggregate([
    { $match: { ...liveFilter, ingredient: { $nin: [null, ""] } } },
    { $group: { _id: "$ingredient", count: { $sum: 1 } } },
  ]);
  const counts = new Map(rows.map((r) => [String(r._id).toLowerCase().trim(), r.count]));
  const names = taxonomy.length ? taxonomy : rows.map((r) => String(r._id));
  return names.map((name) => ({ name, slug: slugify(name), count: counts.get(String(name).toLowerCase().trim()) || 0 }));
}

/** Newest live products first (real "New Launches" rail). */
export async function getNewArrivals(n) {
  await dbConnect();
  const docs = await CatalogProduct.find(liveFilter).sort({ createdAt: -1 }).limit(n || 12).lean();
  return docs.map(mapToStorefront);
}

export async function getBestsellers(n) {
  const list = await getStorefrontProducts();
  const ranked = [...list].sort((a, b) => b.reviews * b.rating - a.reviews * a.rating || b.stock - a.stock);
  return n ? ranked.slice(0, n) : ranked;
}

export async function getOffers(n) {
  const list = await getStorefrontProducts();
  const offers = list.filter((p) => p.discount > 0).sort((a, b) => b.discount - a.discount);
  return n ? offers.slice(0, n) : offers;
}

// Lightweight search used by the header overlay API. Regex over the fields the
// UI searches (title, tags, vendor, type, ingredient).
export async function searchProducts(q, limit = 8) {
  await dbConnect();
  const term = String(q || "").trim();
  if (!term) {
    const docs = await CatalogProduct.find(liveFilter).sort({ createdAt: 1 }).limit(limit).lean();
    return docs.map(mapToStorefront);
  }
  const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const docs = await CatalogProduct.find({
    ...liveFilter,
    $or: [{ title: rx }, { tags: rx }, { vendor: rx }, { productType: rx }, { ingredient: rx }],
  }).limit(limit).lean();
  return docs.map(mapToStorefront);
}

// Price resolution for checkout — authoritative prices from MongoDB, never the
// client. Matches a cart line to a product by slug/handle, then to a variant.
export async function resolveCatalogPrices(items) {
  await dbConnect();
  const handles = [...new Set(items.map((i) => i.slug || i.id).filter(Boolean))];
  const docs = await CatalogProduct.find({ handle: { $in: handles }, ...liveFilter }).lean();
  const byHandle = new Map(docs.map((d) => [d.handle, d]));
  const out = [];
  for (const i of items) {
    const d = byHandle.get(i.slug) || byHandle.get(i.id);
    if (!d) return { ok: false };
    
    let matchedVariant = null;
    if (i.sku) {
      matchedVariant = d.variants.find((v) => v.sku === i.sku);
    }
    if (!matchedVariant) {
      matchedVariant = d.variants.find((v) => v.price === i.price) || d.variants[0];
    }
    
    const price = matchedVariant ? matchedVariant.price : d.priceMin;
    const sku = matchedVariant ? matchedVariant.sku : "";
    out.push({ slug: d.handle, name: d.title, qty: i.qty, price, sku });
  }
  return { ok: true, items: out };
}

import { Product } from "@/lib/db/models/Product";
import { Seller } from "@/lib/db/models/Seller";
import { AuditLog } from "@/lib/db/models/AuditLog";

export async function decrementStock(items, session = null, actorId = null) {
  await dbConnect();
  for (const i of items) {
    const handle = i.slug || i.id;
    if (!handle) continue;
    
    let matchedSku = i.sku;
    let price = i.price;
    
    const catalogProd = await CatalogProduct.findOne({ handle }).session(session);
    if (!catalogProd) {
      throw new Error(`CatalogProduct not found for handle: ${handle}`);
    }
    
    let matchedVariant = null;
    if (matchedSku) {
      matchedVariant = catalogProd.variants.find((v) => v.sku === matchedSku);
    }
    if (!matchedVariant) {
      matchedVariant = catalogProd.variants.find((v) => v.price === price) || catalogProd.variants[0];
    }
    
    if (!matchedVariant) {
      throw new Error(`No variant found for product handle: ${handle}`);
    }
    
    matchedSku = matchedVariant.sku;
    price = matchedVariant.price;
    
    // Atomic variant update prevents overselling. Variants whose inventory
    // policy is "continue" allow backorders (stock may go to/below zero).
    const allowBackorder = matchedVariant.inventoryPolicy === "continue";
    const query = { handle, "variants.sku": matchedSku };
    if (!allowBackorder) query["variants.inventoryQty"] = { $gte: i.qty };
    const updatedCatalog = await CatalogProduct.findOneAndUpdate(
      query,
      { $inc: { "variants.$.inventoryQty": -i.qty } },
      { session, new: true }
    );

    if (!updatedCatalog) {
      throw new Error(`Oversold or variant out of stock for SKU: ${matchedSku} (requested: ${i.qty})`);
    }
    
    try {
      const product = await Product.findOne({ sku: matchedSku }).session(session);
      if (product) {
        product.stock = Math.max(0, product.stock - i.qty);
        product.sales += i.qty;
        await product.save({ session });
        
        if (product.seller) {
          await Seller.updateOne(
            { _id: product.seller },
            {
              $inc: {
                "stats.inventoryValue": -(price * i.qty),
              }
            },
            { session }
          );
        }
      }
      
      await AuditLog.create(
        [
          {
            action: "stock_decrement",
            actor: actorId,
            productId: product ? product._id : null,
            catalogId: handle,
            diff: {
              sku: matchedSku,
              qty: i.qty,
              price,
            },
          },
        ],
        session ? { session } : {}
      );
    } catch (err) {
      if (!session) {
        await CatalogProduct.updateOne(
          { handle, "variants.sku": matchedSku },
          { $inc: { "variants.$.inventoryQty": i.qty } }
        ).catch((rollbackErr) => console.error("[DECREMENT_ROLLBACK_FAILED] Could not roll back catalog decrement:", rollbackErr));
      }
      throw err;
    }
  }
}

export async function catalogCount() {
  await dbConnect();
  return CatalogProduct.countDocuments(liveFilter);
}
