// ============================================================================
// Canonical category resolution for bulk import (isomorphic — no DB / server-only
// imports, so the browser preview resolves categories exactly like the server).
//
// Sellers should never have to edit their CSV for common category names. We fold
// each incoming category to a normalised key that ignores case, spaces, hyphens,
// underscores, ise/ize spelling and singular/plural, then map it to a canonical
// display name. Only genuinely unmatched categories warn.
//
//   "Sunscreens" / "Sun Screen" / "sun-screen"  → "Sunscreen"
//   "Moisturizers" / "moisturiser"              → "Moisturiser"
//   "Haircare"                                  → "Hair Care"
// ============================================================================

// Canonical display names. Order matters only for fold-key collisions (first
// wins) — there are none among these. Client-provided variants map onto these.
export const CANONICAL_CATEGORIES = [
  "Sunscreen",
  "Cleanser",
  "Serum",
  "Moisturiser",
  "Hair Care",
  "Body Care",
  "Medical Devices",
  "Diagnostic Equipment",
  "Clinic Consumables",
  "Supplements",
  "Surgical Supplies",
  // Legacy seller taxonomy — kept so older data / pickers still resolve.
  "Surgical", "Diagnostic", "Hospital Furniture", "Dermatology",
  "Skincare", "Devices", "Consumables", "Laboratory", "Dental",
];

// Explicit aliases that don't fold cleanly to a canonical name.
const ALIASES = {
  "sunblock": "Sunscreen",
  "face wash": "Cleanser",
  "facewash": "Cleanser",
  "supplement": "Supplements",
  "medical device": "Medical Devices",
};

/**
 * Fold a category string to a comparison key: lower-cased, stripped of every
 * non-alphanumeric char (spaces/hyphens/underscores), ize→ise normalised, and
 * de-pluralised (…ies→…y, trailing …s dropped). Domain-scoped and intentionally
 * lenient — over-matching just means fewer false "unknown category" warnings.
 */
export function foldCategoryKey(value) {
  let k = String(value == null ? "" : value).toLowerCase().replace(/[^a-z0-9]+/g, "");
  if (!k) return "";
  k = k.replace(/iz/g, "is"); // American → British (moisturizer → moisturiser)
  if (k.endsWith("ies")) k = k.slice(0, -3) + "y";
  else if (k.length > 2 && k.endsWith("s") && !k.endsWith("ss")) k = k.slice(0, -1);
  return k;
}

const CANON_BY_KEY = new Map();
for (const c of CANONICAL_CATEGORIES) {
  const k = foldCategoryKey(c);
  if (k && !CANON_BY_KEY.has(k)) CANON_BY_KEY.set(k, c);
}
const ALIAS_BY_KEY = new Map(Object.entries(ALIASES).map(([k, v]) => [foldCategoryKey(k), v]));

/**
 * Resolve a raw category to its canonical display name, tolerating case /
 * spacing / hyphens / underscores / ise-ize / singular-plural differences.
 * `extra` lets callers fold in DB-defined categories too (their display form is
 * returned as-is on a fold match).
 * @returns {string|null} canonical name, or null when there is genuinely no match.
 */
export function canonicalCategory(raw, extra = []) {
  const key = foldCategoryKey(raw);
  if (!key) return null;
  if (CANON_BY_KEY.has(key)) return CANON_BY_KEY.get(key);
  if (ALIAS_BY_KEY.has(key)) return ALIAS_BY_KEY.get(key);
  for (const e of extra) if (foldCategoryKey(e) === key) return e;
  return null;
}
