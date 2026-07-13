// ============================================================================
// Isomorphic bulk-row validation + normalisation. Pure (no DB / no server-only)
// so the browser preview can re-validate edited rows with the exact same rules
// the server enforces. DB-dependent facts (existing SKUs, known categories) are
// passed in by the caller.
//
// Row status precedence: error > warning > valid.
// ============================================================================
import { IMAGE_KEYS } from "./columns.js";
import { canonicalCategory } from "./categories.js";
import { productBusinessErrors, gstIsNonStandard } from "@/lib/products/rules";

const FORMULA = /^[=+\-@\t\r]/;
const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

// Neutralise spreadsheet-formula triggers in stored TEXT (CSV-injection guard).
const safeText = (v) => {
  const s = v == null ? "" : String(v).trim();
  return FORMULA.test(s) ? "'" + s : s;
};
const isUrl = (s) => /^https?:\/\/\S+$/i.test(s);
const num = (v) => {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : NaN;
};

/** Classify a single image cell: "url" | "file" | "invalid" | "empty". */
export function classifyImage(v) {
  const s = String(v || "").trim();
  if (!s) return "empty";
  if (isUrl(s)) return "url";
  if (IMG_EXT.test(s) && !/\s/.test(s)) return "file"; // ZIP filename
  return "invalid";
}

/**
 * @param {Array<{rowIndex:number,data:Object}>} rows
 * @param {{knownCategories?:string[], existingSkus?:string[]}} opts
 * @returns {Array} validated rows with {rowIndex,status,errors,warnings,normalized,sku,name}
 */
export function validateRows(rows, opts = {}) {
  const knownCategories = opts.knownCategories || [];
  const existing = new Set((opts.existingSkus || []).map((s) => String(s).toLowerCase().trim()));

  // First pass — within-file duplicate detection.
  const skuSeen = new Map();
  const nameSeen = new Map();
  for (const r of rows) {
    const sku = String(r.data.sku || "").toLowerCase().trim();
    const name = String(r.data.name || "").toLowerCase().trim();
    if (sku) skuSeen.set(sku, (skuSeen.get(sku) || 0) + 1);
    if (name) nameSeen.set(name, (nameSeen.get(name) || 0) + 1);
  }

  return rows.map((r) => {
    const d = r.data || {};
    const errors = [];
    const warnings = [];

    const name = safeText(d.name);
    const sku = safeText(d.sku);
    const skuLc = sku.toLowerCase();
    const rawCategory = safeText(d.category);
    // Resolve to a canonical category (case/spacing/plural/ize-ise tolerant), so
    // "Sunscreens" → "Sunscreen" and only genuinely unknown names warn.
    const canonical = canonicalCategory(rawCategory, knownCategories);
    const category = canonical || rawCategory;

    // --- required ---
    if (!name) errors.push("Product Name is required");
    if (!sku) errors.push("SKU is required");
    if (!category) errors.push("Category is required");

    // --- SKU duplicates ---
    if (sku && skuSeen.get(skuLc) > 1) errors.push("Duplicate SKU in file");
    if (sku && existing.has(skuLc)) errors.push("SKU already exists in your catalogue");

    // --- duplicate name (within file) ---
    if (name && nameSeen.get(name.toLowerCase()) > 1) warnings.push("Duplicate Product Name in file");

    // --- pricing / stock / GST (SHARED business rules — identical to manual add) ---
    const price = num(d.price);
    const mrp = num(d.mrp);
    const stock = num(d.stock);
    const gst = num(d.gst);
    for (const e of productBusinessErrors(d)) errors.push(e.message);
    if (gstIsNonStandard(d.gst)) warnings.push("GST is not a standard slab (0/5/12/18/28)");
    const stockVal = stock !== null && !Number.isNaN(stock) && stock >= 0 ? Math.floor(stock) : 0;
    const gstVal = gst !== null && !Number.isNaN(gst) && gst >= 0 && gst <= 28 ? gst : 18;

    // --- category known? --- (only warn when no canonical match was found)
    if (rawCategory && !canonical) warnings.push(`Unknown category "${rawCategory}"`);

    // --- brand ---
    if (!safeText(d.brand)) warnings.push("Brand is missing");

    // --- weight ---
    const weight = safeText(d.weight);
    if (weight && !/^\d+(\.\d+)?\s*(g|kg|ml|l|mg|oz|pcs|pack)?$/i.test(weight)) warnings.push("Weight format looks invalid (e.g. 50g, 100ml)");

    // --- HSN ---
    const hsn = safeText(d.hsn);
    if (hsn && !/^\d{4,8}$/.test(hsn)) warnings.push("HSN should be 4-8 digits");

    // --- description ---
    let description = safeText(d.description);
    if (!description) warnings.push("Description is empty");
    else if (description.length > 5000) { warnings.push("Description over 5000 chars — will be truncated"); description = description.slice(0, 5000); }

    // --- images ---
    const images = [];
    for (const k of IMAGE_KEYS) {
      const v = String(d[k] || "").trim();
      const kind = classifyImage(v);
      if (kind === "empty") continue;
      if (kind === "invalid") warnings.push(`${k.replace("image", "Image ")} is not a valid URL or image filename`);
      else images.push(v);
    }
    if (!images.length) warnings.push("No image provided — a placeholder will be used");

    // --- status ---
    const statusRaw = String(d.status || "").toLowerCase().trim();
    const status = statusRaw === "draft" ? "draft" : "pending";

    const normalized = {
      name, sku, brand: safeText(d.brand), category, subcategory: safeText(d.subcategory),
      price: typeof price === "number" && !Number.isNaN(price) ? price : 0,
      mrp: typeof mrp === "number" && !Number.isNaN(mrp) ? mrp : 0,
      stock: stockVal, gst: gstVal, weight, hsn,
      description, ingredients: safeText(d.ingredients), howToUse: safeText(d.howToUse),
      images, status,
    };

    const status2 = errors.length ? "error" : warnings.length ? "warning" : "valid";
    return { rowIndex: r.rowIndex, status: status2, errors, warnings, normalized, sku, name };
  });
}

export function summarize(validated) {
  const c = { total: validated.length, valid: 0, warnings: 0, errors: 0 };
  for (const r of validated) {
    if (r.status === "error") c.errors++;
    else if (r.status === "warning") c.warnings++;
    else c.valid++;
  }
  return c;
}
