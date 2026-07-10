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
