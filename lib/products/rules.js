// ============================================================================
// Single source of truth for product business rules + text sanitization, shared
// by the manual Add-Product path (app/api/seller/products) AND Bulk Upload
// (lib/bulk/validate). Isomorphic (no DB / server-only imports) so the browser
// preview and both server paths enforce identical rules — there must never be
// two validation systems.
// ============================================================================

export const PRICE_MIN = 0;                 // ₹ — non-negative
export const PRICE_MAX = 10_000_000;        // ₹1,00,00,000 per-unit ceiling
export const GST_SLABS = [0, 5, 12, 18, 28];
export const GST_MIN = 0;
export const GST_MAX = 28;

const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

/** Parse a possibly-formatted number ("1,299" / " 50 ") → number | null | NaN. */
export function toNum(v) {
  if (v === "" || v == null) return null;
  const n = Number(String(v).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Core cross-field business rules for a product. Pure — returns a flat list of
 * { field, message }. Callers shape it (per-field map for the manual API,
 * per-row strings for bulk). Numbers may be raw strings; they are parsed here.
 */
export function productBusinessErrors(d = {}) {
  const errors = [];
  const price = toNum(d.price);
  const mrp = toNum(d.mrp);
  const stock = toNum(d.stock);
  const gst = toNum(d.gst);

  // --- price (required) ---
  if (price === null) errors.push({ field: "price", message: "Price is required" });
  else if (Number.isNaN(price)) errors.push({ field: "price", message: "Price is not a valid number" });
  else if (price < PRICE_MIN) errors.push({ field: "price", message: "Price cannot be negative" });
  else if (price > PRICE_MAX) errors.push({ field: "price", message: `Price cannot exceed ${inr(PRICE_MAX)}` });

  // --- mrp (optional; must be ≥ price when set) ---
  if (mrp !== null) {
    if (Number.isNaN(mrp)) errors.push({ field: "mrp", message: "MRP is not a valid number" });
    else if (mrp < 0) errors.push({ field: "mrp", message: "MRP cannot be negative" });
    else if (mrp > PRICE_MAX) errors.push({ field: "mrp", message: `MRP cannot exceed ${inr(PRICE_MAX)}` });
    else if (mrp > 0 && price !== null && !Number.isNaN(price) && mrp < price)
      errors.push({ field: "mrp", message: "MRP must be greater than or equal to Price" });
  }

  // --- stock (optional; non-negative) ---
  if (stock !== null && !Number.isNaN(stock) && stock < 0)
    errors.push({ field: "stock", message: "Stock cannot be negative" });

  // --- gst (optional; 0–28) ---
  if (gst !== null && !Number.isNaN(gst) && (gst < GST_MIN || gst > GST_MAX))
    errors.push({ field: "gst", message: `GST must be between ${GST_MIN} and ${GST_MAX}%` });

  return errors;
}

/** True when GST is set but off the standard slabs (a warning, not an error). */
export function gstIsNonStandard(v) {
  const g = toNum(v);
  return g !== null && !Number.isNaN(g) && !GST_SLABS.includes(g);
}

/**
 * Neutralize seller-entered text so stored values can never carry HTML/markup
 * into a non-escaping sink (PDF invoices, CSV, transactional email). Strips
 * tags and drops stray angle brackets. React already escapes on render; this is
 * defense-in-depth for the non-HTML sinks.
 */
export function sanitizeText(v, max = 5000) {
  if (v == null) return "";
  return String(v).replace(/<[^>]*>/g, "").replace(/[<>]/g, "").slice(0, max);
}
