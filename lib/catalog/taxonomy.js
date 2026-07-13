// ============================================================================
// Shared taxonomy helper for storefront categories, tags, and types.
// ============================================================================

export const TAXONOMY = {
  serum: { category: "serum", categoryName: "Serums", color: "#88068e" },
  sunscreen: { category: "sunscreen", categoryName: "Sunscreens", color: "#cf5c2d" },
  cleanser: { category: "cleanser", categoryName: "Cleansers", color: "#006f5f" },
  "face wash": { category: "cleanser", categoryName: "Cleansers", color: "#006f5f" },
  moisturiser: { category: "moisturiser", categoryName: "Moisturisers", color: "#3f8ddf" },
  moisturizer: { category: "moisturiser", categoryName: "Moisturisers", color: "#3f8ddf" },
  cream: { category: "cream", categoryName: "Face Cream", color: "#936a6a" },
  "face cream": { category: "cream", categoryName: "Face Cream", color: "#936a6a" },
  "hair care": { category: "hair", categoryName: "Hair Care", color: "#4770db" },
  "kit / combo": { category: "combo", categoryName: "Combos & Kits", color: "#cf5c2d" },
  combo: { category: "combo", categoryName: "Combos & Kits", color: "#cf5c2d" },
  kit: { category: "combo", categoryName: "Combos & Kits", color: "#cf5c2d" },
};

export const INGREDIENTS = ["Vitamin C", "Niacinamide", "Retinol", "Hyaluronic", "Salicylic", "Ceramide", "Glycolic", "Alpha Arbutin", "Caffeine", "Zinc", "Glutathione", "Biotin"];
export const SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal", "All"];

export function getPresentation(type, tags = [], title = "") {
  const key = String(type || "").toLowerCase().trim();
  const t = TAXONOMY[key] || Object.entries(TAXONOMY).find(([k]) => key.includes(k))?.[1] || { category: "skincare", categoryName: type || "Skincare", color: "#3056D3" };
  const tagList = Array.isArray(tags) ? tags : [];
  const hay = (tagList.join(" ") + " " + title).toLowerCase();
  const ingredient = INGREDIENTS.find((i) => hay.includes(i.toLowerCase())) || "";
  const skin = SKIN_TYPES.find((s) => hay.includes(s.toLowerCase())) || (hay.includes("all skin") ? "All" : "");
  return { ...t, ingredient, skinTypes: skin };
}
