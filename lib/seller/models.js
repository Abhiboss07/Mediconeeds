// ============================================================================
// SELLER DOMAIN MODELS (Phase 14)
// Normalized entity shapes + enums for the Mediconeeds seller marketplace.
// These JSDoc typedefs document the schema the real database + APIs will use;
// the mock JSON in /data/seller/seed.json conforms to them. When the backend
// lands, replace lib/seller/store.js's data source with API calls — the shapes
// stay identical, so UI/components need no changes.
// ============================================================================

/** @typedef {"guest"|"buyer"|"seller"|"admin"|"superadmin"} Role */

/** @typedef {"draft"|"pending"|"active"|"rejected"|"archived"} ProductStatus */
/** @typedef {"new"|"confirmed"|"packed"|"shipped"|"delivered"|"cancelled"} OrderStatus */
/** @typedef {"pending"|"approved"|"suspended"|"rejected"} SellerStatus */
/** @typedef {"paid"|"processing"|"upcoming"} SettlementStatus */

/**
 * @typedef {Object} Seller
 * @property {string} id  @property {string} company @property {string} owner
 * @property {string} email @property {string} mobile @property {string} [website]
 * @property {string} gst @property {string} pan @property {string} [cin] @property {string} address
 * @property {{name:string,account:string,ifsc:string}} bank
 * @property {string[]} categories @property {SellerStatus} status
 * @property {string} since @property {number} rating @property {number} fulfilmentRate
 */

/**
 * @typedef {Object} Product
 * @property {string} id @property {string} name @property {string} brand @property {string} sku
 * @property {string} category @property {string} hsn @property {number} gst
 * @property {number} mrp @property {number} price @property {number} wholesale @property {number} moq
 * @property {number} stock @property {ProductStatus} status
 * @property {number} views @property {number} sales @property {number} rating @property {string} image
 */

/**
 * @typedef {Object} Order
 * @property {string} id @property {string} buyer
 * @property {{name:string,qty:number}[]} items
 * @property {number} amount @property {OrderStatus} status
 * @property {"paid"|"cod"|"pending"} payment @property {string} date @property {string} tracking
 */

// ---- Enum option lists + display metadata (single source of truth for UI) ----

export const PRODUCT_STATUS = {
  draft: { label: "Draft", tone: "gray" },
  pending: { label: "Pending approval", tone: "amber" },
  active: { label: "Active", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
  archived: { label: "Archived", tone: "gray" },
};

export const ORDER_STATUS = {
  new: { label: "New", tone: "blue", next: "confirmed" },
  confirmed: { label: "Confirmed", tone: "indigo", next: "packed" },
  packed: { label: "Packed", tone: "amber", next: "shipped" },
  shipped: { label: "Shipped", tone: "violet", next: "delivered" },
  delivered: { label: "Delivered", tone: "green", next: null },
  cancelled: { label: "Cancelled", tone: "red", next: null },
};

export const SETTLEMENT_STATUS = {
  paid: { label: "Paid", tone: "green" },
  processing: { label: "Processing", tone: "amber" },
  upcoming: { label: "Upcoming", tone: "blue" },
};

// Marketplace categories (medical + skincare — B2B breadth like Medikabazaar).
export const SELLER_CATEGORIES = [
  "Surgical", "Diagnostic", "Hospital Furniture", "Dermatology",
  "Skincare", "Devices", "Consumables", "Laboratory", "Dental",
];

// The 9-step public seller journey (Phase 2 timeline).
export const SELLER_JOURNEY = [
  { n: 1, t: "Create Seller Account", d: "Sign up with your business email in under a minute." },
  { n: 2, t: "Business Verification", d: "We verify your company identity and contact details." },
  { n: 3, t: "Upload GST, PAN & Documents", d: "Submit statutory documents for KYC compliance." },
  { n: 4, t: "Submit Products", d: "Add your catalogue individually or via bulk CSV upload." },
  { n: 5, t: "Verification by Mediconeeds", d: "Our team reviews listings for quality & compliance." },
  { n: 6, t: "Products Go Live", d: "Approved products appear to 20,000+ verified buyers." },
  { n: 7, t: "Receive Orders", d: "Get real-time order alerts on your seller dashboard." },
  { n: 8, t: "Ship Products", d: "Print labels, hand over to logistics, share tracking." },
  { n: 9, t: "Receive Payments", d: "Settlements credited to your bank on a fixed cycle." },
];

export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const inrShort = (n) => {
  n = Number(n || 0);
  if (n >= 1e7) return "₹" + (n / 1e7).toFixed(2) + " Cr";
  if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
  if (n >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "K";
  return "₹" + n;
};
