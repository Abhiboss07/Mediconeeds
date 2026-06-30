// ============================================================================
// Form services + validation helpers (shared by Export & Become-Supplier forms).
// Keeps validation/transport out of the UI components so they stay declarative.
// ============================================================================

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
export const isPhone = (v) => /^[+]?[\d\s-]{8,15}$/.test(String(v || "").trim());
// Indian GSTIN format (15 chars). Optional unless required.
export const isGST = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(String(v || "").trim().toUpperCase());

// Validate a flat values object against a field schema.
// schema: { name: { label, required, type } }  type ∈ email|phone|gst|text
export function validate(values, schema) {
  const errors = {};
  for (const [name, rule] of Object.entries(schema)) {
    const raw = values[name];
    const val = typeof raw === "string" ? raw.trim() : raw;
    if (rule.required && (val == null || val === "" || (Array.isArray(val) && !val.length))) {
      errors[name] = `${rule.label} is required`;
      continue;
    }
    if (!val) continue; // optional + empty → skip format checks
    if (rule.type === "email" && !isEmail(val)) errors[name] = "Enter a valid email address";
    if (rule.type === "phone" && !isPhone(val)) errors[name] = "Enter a valid phone number";
    if (rule.type === "gst" && !isGST(val)) errors[name] = "Enter a valid 15-character GSTIN";
  }
  return errors;
}

// POST JSON to an internal API route. Returns parsed JSON ({ ok, ref, ... }).
export async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

// Shared option lists.
export const COUNTRIES = [
  "United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Oman", "Bahrain",
  "United Kingdom", "United States", "Canada", "Australia", "Singapore",
  "Malaysia", "Nepal", "Bangladesh", "Sri Lanka", "Nigeria", "Kenya",
  "South Africa", "Other",
];
export const PRODUCT_CATEGORIES = [
  "Sunscreen", "Serum", "Cleanser", "Moisturiser", "Face Cream", "Hair Care",
  "Acne Care", "Anti-Ageing", "Pigmentation", "Lip Care", "Body Care", "Under Eye",
];
