// ============================================================================
// Server-side bulk-upload helpers shared by the API routes: known-category and
// existing-SKU lookups, per-row shaping for the preview, and publishing a row
// into a real pending Product (reusing the exact manual-add path + publish
// bridge, so bulk products enter the SAME admin approval flow).
// ============================================================================
import "server-only";
import { dbConnect } from "@/lib/db/mongoose";
import { Product } from "@/lib/db/models/Product";
import { Category } from "@/lib/db/models/Category";
import { SELLER_CATEGORIES } from "@/lib/seller/models";
import { deFormula } from "@/lib/bulk/csv";

const clean = (v) => deFormula(v == null ? "" : String(v)).slice(0, 5000);

export async function getKnownCategories() {
  await dbConnect();
  let names = [];
  try { names = await Category.find({ active: true }).distinct("name"); } catch { /* ignore */ }
  return [...new Set([...names, ...SELLER_CATEGORIES])];
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

/**
 * Create a pending Product from a batch row's normalised data. Same shape as
 * manual Add Product; enters "pending" (or "draft") for admin approval.
 * @returns {Promise<{ok:boolean, productId?:string, reason?:string}>}
 */
export async function publishRow(rowData, sellerId, batchId, session = null) {
  const d = rowData || {};
  if (!d.name || !d.sku) return { ok: false, reason: "Missing name or SKU" };

  // Guard against a duplicate slug for this seller (unique index {seller,slug}).
  const slug = String(d.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const clash = await Product.findOne({ seller: sellerId, slug }).select("_id").session(session).lean();
  if (clash) return { ok: false, reason: `A product with a matching name/slug already exists (${slug})` };
  if (d.sku) {
    const skuClash = await Product.findOne({ seller: sellerId, sku: d.sku, deleted: { $ne: true } }).select("_id").session(session).lean();
    if (skuClash) return { ok: false, reason: `SKU already exists in your catalogue (${d.sku})` };
  }

  const images = Array.isArray(d.images) ? d.images.filter(Boolean) : [];
  try {
    // Defensive: strip any spreadsheet-formula triggers before persisting text.
    const product = new Product({
      seller: sellerId,
      name: clean(d.name), sku: clean(d.sku), brand: clean(d.brand), category: clean(d.category),
      subcategory: clean(d.subcategory), hsn: clean(d.hsn), gst: typeof d.gst === "number" ? d.gst : 18,
      mrp: d.mrp || 0, price: d.price || 0, stock: d.stock || 0,
      weight: clean(d.weight), description: clean(d.description), ingredients: clean(d.ingredients),
      howToUse: clean(d.howToUse), images, image: images[0],
      status: d.status === "draft" ? "draft" : "pending",
      bulkBatch: batchId,
    });
    await product.save({ session });
    return { ok: true, productId: String(product._id) };
  } catch (err) {
    const msg = err?.code === 11000 ? "Duplicate SKU/slug in catalogue" : (err?.message || "Create failed");
    return { ok: false, reason: msg };
  }
}
