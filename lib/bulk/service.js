// ============================================================================
// Server-side bulk-upload helpers shared by the API routes: known-category and
// existing-SKU lookups, per-row shaping for the preview, and publishing a row
// into a real pending Product (reusing the exact manual-add path + publish
// bridge, so bulk products enter the SAME admin approval flow).
// ============================================================================
import "server-only";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db/mongoose";
import { Product } from "@/lib/db/models/Product";
import { Category } from "@/lib/db/models/Category";
import { SELLER_CATEGORIES } from "@/lib/seller/models";
import { CANONICAL_CATEGORIES } from "@/lib/bulk/categories";
import { deFormula } from "@/lib/bulk/csv";

const clean = (v) => deFormula(v == null ? "" : String(v)).slice(0, 5000);
const slugify = (name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function buildDoc(d, sellerId, batchId, slug) {
  const images = Array.isArray(d.images) ? d.images.filter(Boolean) : [];
  return {
    _id: new mongoose.Types.ObjectId(),
    seller: sellerId,
    name: clean(d.name), sku: clean(d.sku), slug, brand: clean(d.brand), category: clean(d.category),
    subcategory: clean(d.subcategory), hsn: clean(d.hsn), gst: typeof d.gst === "number" ? d.gst : 18,
    mrp: d.mrp || 0, price: d.price || 0, stock: d.stock || 0,
    weight: clean(d.weight), description: clean(d.description), ingredients: clean(d.ingredients),
    howToUse: clean(d.howToUse), images, image: images[0],
    status: d.status === "draft" ? "draft" : "pending", bulkBatch: batchId,
    deleted: false, // explicit so the partial unique {seller,slug} index always includes new docs
  };
}

/**
 * Publish a whole chunk in ~3 DB round-trips (bulk clash-check + insertMany),
 * instead of 3 per row. insertMany skips the save-hook, so slug/image are set
 * explicitly. Pre-assigned _ids let us report productId even on partial insert.
 * @returns {Promise<Map<number,{ok,productId?,reason?}>>} keyed by rowIndex
 */
export async function publishChunk(items, sellerId, batchId) {
  await dbConnect();
  const results = new Map();
  const prepared = [];
  for (const it of items) {
    const d = it.data || {};
    if (!d.name || !d.sku) { results.set(it.rowIndex, { ok: false, reason: "Missing name or SKU" }); continue; }
    prepared.push({ rowIndex: it.rowIndex, d, slug: slugify(d.name), skuLc: String(d.sku).toLowerCase() });
  }

  // Dedupe within the chunk (first wins).
  const seenSlug = new Set(), seenSku = new Set(), uniq = [];
  for (const p of prepared) {
    if (seenSlug.has(p.slug)) { results.set(p.rowIndex, { ok: false, reason: `Duplicate name/slug in file (${p.slug})` }); continue; }
    if (p.skuLc && seenSku.has(p.skuLc)) { results.set(p.rowIndex, { ok: false, reason: `Duplicate SKU in file (${p.d.sku})` }); continue; }
    seenSlug.add(p.slug); if (p.skuLc) seenSku.add(p.skuLc); uniq.push(p);
  }
  if (!uniq.length) return results;

  // One query for all existing slug/sku clashes for this seller.
  const existing = await Product.find({
    seller: sellerId, deleted: { $ne: true },
    $or: [{ slug: { $in: uniq.map((p) => p.slug) } }, { sku: { $in: uniq.map((p) => p.d.sku).filter(Boolean) } }],
  }).select("slug sku").lean();
  const takenSlug = new Set(existing.map((e) => String(e.slug).toLowerCase()));
  const takenSku = new Set(existing.map((e) => String(e.sku || "").toLowerCase()).filter(Boolean));

  const toInsert = [];
  for (const p of uniq) {
    if (takenSlug.has(p.slug)) { results.set(p.rowIndex, { ok: false, reason: `A product with a matching name/slug already exists (${p.slug})` }); continue; }
    if (p.skuLc && takenSku.has(p.skuLc)) { results.set(p.rowIndex, { ok: false, reason: `SKU already exists in your catalogue (${p.d.sku})` }); continue; }
    toInsert.push({ rowIndex: p.rowIndex, doc: buildDoc(p.d, sellerId, batchId, p.slug) });
  }
  if (!toInsert.length) return results;

  try {
    await Product.insertMany(toInsert.map((t) => t.doc), { ordered: false });
    for (const t of toInsert) results.set(t.rowIndex, { ok: true, productId: String(t.doc._id) });
  } catch (err) {
    // ordered:false → independent inserts; writeErrors[].index marks the failures.
    const failed = new Set((err.writeErrors || []).map((w) => w.index));
    toInsert.forEach((t, i) => results.set(t.rowIndex, failed.has(i)
      ? { ok: false, reason: "Duplicate SKU/slug in catalogue" }
      : { ok: true, productId: String(t.doc._id) }));
  }
  return results;
}

export async function getKnownCategories() {
  await dbConnect();
  let names = [];
  try { names = await Category.find({ active: true }).distinct("name"); } catch { /* ignore */ }
  return [...new Set([...CANONICAL_CATEGORIES, ...names, ...SELLER_CATEGORIES])];
}

export async function getExistingSkus(sellerId) {
  await dbConnect();
  const skus = await Product.find({ seller: sellerId, deleted: { $ne: true }, sku: { $ne: "" } }).distinct("sku");
  return skus.filter(Boolean);
}

// Lightweight, response-safe shape for the preview grid — never ships full
// image data-URIs (those stay server-side on the batch).
export function previewRow(row) {
  const d = row.data || {};
  const imgs = d.images || [];
  const first = imgs[0] || "";
  const isDataUri = /^data:/.test(first);
  const source = !imgs.length ? "none" : /^https?:/i.test(first) ? "url" : isDataUri ? "zip" : "placeholder";
  return {
    rowIndex: row.rowIndex,
    status: row.status,
    errors: row.issues || [], // client-facing field stays "errors"
    warnings: row.warnings || [],
    name: d.name || "",
    sku: d.sku || "",
    brand: d.brand || "",
    category: d.category || "",
    subcategory: d.subcategory || "",
    price: d.price ?? 0,
    mrp: d.mrp ?? 0,
    stock: d.stock ?? 0,
    gst: d.gst ?? 18,
    weight: d.weight || "",
    hsn: d.hsn || "",
    description: d.description || "",
    imageThumb: source === "url" ? first : source === "zip" ? "zip" : "",
    imageCount: imgs.length,
    imageSource: source,
    rowStatusTarget: d.status || "pending",
  };
}

