// ============================================================================
// Canonical column schema for the seller bulk-upload template. Header matching
// is tolerant (case/spacing/alias-insensitive) so a file exported from Excel,
// Shopify or IndiaMART still maps cleanly. Shared by the parser, validator,
// template generator and error report — one source of truth.
// ============================================================================

// key: internal field · header: canonical CSV header · aliases: accepted spellings
export const COLUMNS = [
  { key: "name", header: "Product Name", aliases: ["name", "product", "title", "productname"], required: true },
  { key: "sku", header: "SKU", aliases: ["sku", "skucode", "sku code", "code"], required: true },
  { key: "brand", header: "Brand", aliases: ["brand", "make", "manufacturer"] },
  { key: "category", header: "Category", aliases: ["category", "cat"], required: true },
  { key: "subcategory", header: "Subcategory", aliases: ["subcategory", "sub category", "sub-category"] },
  { key: "price", header: "Price", aliases: ["price", "sellingprice", "selling price", "sale price", "unit price", "base price", "price excl gst", "price excluding gst"], required: true },
  { key: "mrp", header: "MRP", aliases: ["mrp", "maximumretailprice", "maximum retail price", "compare at price", "compareprice", "list price"] },
  { key: "stock", header: "Stock", aliases: ["stock", "qty", "quantity", "inventory", "stock level", "stock qty", "available stock"] },
  { key: "gst", header: "GST", aliases: ["gst", "gst%", "tax", "taxrate", "gst rate", "gst percentage", "tax rate"] },
  { key: "weight", header: "Weight", aliases: ["weight", "netweight", "net weight", "weight gms", "weight grams", "gross weight"] },
  { key: "hsn", header: "HSN Code", aliases: ["hsn", "hsncode", "hsn code"] },
  { key: "description", header: "Description", aliases: ["description", "desc", "details", "product description"] },
  { key: "ingredients", header: "Ingredients", aliases: ["ingredients", "composition"] },
  { key: "howToUse", header: "How To Use", aliases: ["howtouse", "how to use", "usage", "directions", "usage instructions", "usage instruction", "directions for use", "how to apply"] },
  { key: "image1", header: "Image1", aliases: ["image1", "image 1", "image", "imageurl", "image url"] },
  { key: "image2", header: "Image2", aliases: ["image2", "image 2"] },
  { key: "image3", header: "Image3", aliases: ["image3", "image 3"] },
  { key: "image4", header: "Image4", aliases: ["image4", "image 4"] },
  { key: "image5", header: "Image5", aliases: ["image5", "image 5"] },
  { key: "status", header: "Status", aliases: ["status", "state"] },
];

export const IMAGE_KEYS = ["image1", "image2", "image3", "image4", "image5"];
export const HEADERS = COLUMNS.map((c) => c.header);
export const REQUIRED_KEYS = COLUMNS.filter((c) => c.required).map((c) => c.key);

const norm = (h) => String(h || "").toLowerCase().replace(/[\s_\-]+/g, " ").trim();

// Build alias → canonical key lookup once.
const ALIAS_MAP = (() => {
  const m = {};
  for (const c of COLUMNS) {
    m[norm(c.header)] = c.key;
    m[norm(c.key)] = c.key;
    for (const a of c.aliases || []) m[norm(a)] = c.key;
  }
  return m;
})();

// Drop parenthetical qualifiers and stray % / . so headers like
// "Price (Excl. GST)", "GST Rate (%)" or "Weight (gms)" still resolve.
const simplify = (s) => norm(s).replace(/\(.*?\)/g, " ").replace(/[%.]/g, " ").replace(/\s+/g, " ").trim();

/** Map an arbitrary header string to a canonical key, or null if unknown. */
export function resolveHeader(header) {
  const n = norm(header);
  return ALIAS_MAP[n] || ALIAS_MAP[simplify(header)] || null;
}

// Two example rows for the sample template.
export const SAMPLE_ROWS = [
  {
    name: "Dr Awish Vitamin C Serum", sku: "VC100", brand: "Dr Awish", category: "Skincare", subcategory: "Face Serum",
    price: "599", mrp: "799", stock: "120", gst: "18", weight: "50g", hsn: "330499",
    description: "Brightening 10% vitamin C serum for radiant, even-toned skin.",
    ingredients: "Vitamin C (Ethyl Ascorbic Acid), Hyaluronic Acid, Ferulic Acid",
    howToUse: "Apply 3-4 drops on cleansed face every morning before sunscreen.",
    image1: "https://cdn.mediconeeds.com/products/vc100-1.jpg",
    image2: "https://cdn.mediconeeds.com/products/vc100-2.jpg",
    image3: "", image4: "", image5: "", status: "Draft",
  },
  {
    name: "Dr Awish Niacinamide Serum", sku: "NIA10", brand: "Dr Awish", category: "Skincare", subcategory: "Face Serum",
    price: "549", mrp: "699", stock: "80", gst: "18", weight: "30ml", hsn: "330499",
    description: "10% niacinamide + zinc to control oil and minimise pores.",
    ingredients: "Niacinamide 10%, Zinc PCA, Panthenol",
    howToUse: "Apply a few drops morning and night after cleansing.",
    image1: "NIA10.jpg", image2: "", image3: "", image4: "", image5: "", status: "Draft",
  },
];

export const INSTRUCTIONS = `MEDICONEEDS — BULK PRODUCT UPLOAD INSTRUCTIONS
================================================

1. Download the sample template (sample-products.csv) and keep the header row exactly as-is.
2. One product per row. Required columns: Product Name, SKU, Category, Price.
3. SKU must be unique within your catalogue and within the file.
4. Price and MRP are in INR (numbers only, no ₹ symbol). MRP must be >= Price.
5. GST is a percentage (0, 5, 12, 18 or 28). Stock is a whole number (>= 0).
6. Status may be "Draft" (kept private) or "Pending" (submitted for approval).
   NOTE: Products are NEVER published live directly — every row is created as
   "Pending Approval" and goes live only after the Mediconeeds team approves it.
7. Images:
   • Put full https:// URLs in Image1..Image5, OR
   • Put a filename (e.g. VC100.jpg) and upload a matching Images ZIP. The system
     matches ZIP images to rows by SKU or by the filename you provide.
   • Missing images are allowed — a placeholder is shown until you add one.
8. Do NOT start any cell with = + - or @ (these are treated as spreadsheet
   formulas). Such values are automatically prefixed with a quote for safety.
9. Max file size: 20 MB (CSV/XLSX). Max images ZIP: 500 MB.
10. After uploading you will validate, preview and edit rows before publishing.

Columns: ${HEADERS.join(", ")}
`;
