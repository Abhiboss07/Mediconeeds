// ============================================================================
// CatalogProduct — a full Shopify-shaped storefront product, imported from a
// Shopify product CSV. This is the buyer-facing catalogue source of truth
// (distinct from the seller-listing `Product` model). Deduplicated by `handle`:
// re-importing the same handle UPDATES the existing document.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

const VariantSchema = new Schema(
  {
    sku: { type: String, trim: true, default: "" },
    barcode: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" }, // e.g. "50 ml / Blue"
    option1: { type: String, default: "" },
    option2: { type: String, default: "" },
    option3: { type: String, default: "" },
    price: { type: Number, default: 0 },
    compareAt: { type: Number, default: 0 }, // Variant Compare At Price
    grams: { type: Number, default: 0 }, // weight in grams
    weightUnit: { type: String, default: "g" },
    inventoryQty: { type: Number, default: 0 },
    inventoryPolicy: { type: String, default: "deny" }, // deny | continue
    inventoryTracker: { type: String, default: "" }, // shopify | ""
    fulfillmentService: { type: String, default: "manual" },
    requiresShipping: { type: Boolean, default: true },
    taxable: { type: Boolean, default: true },
    imageSrc: { type: String, default: "" },
    position: { type: Number, default: 1 },
  },
  { _id: false }
);

const ImageSchema = new Schema(
  { src: { type: String, required: true }, position: { type: Number, default: 1 }, alt: { type: String, default: "" } },
  { _id: false }
);

const CatalogProductSchema = new Schema(
  {
    // Identity — unique, dedup key
    handle: { type: String, required: true, unique: true, index: true, trim: true },
    title: { type: String, required: true, trim: true },
    bodyHtml: { type: String, default: "" },

    // Catalogue metadata
    vendor: { type: String, trim: true, default: "", index: true },
    productType: { type: String, trim: true, default: "", index: true },
    productCategory: { type: String, trim: true, default: "" }, // Shopify standard taxonomy
    tags: { type: [String], default: [], index: true },
    collections: { type: [String], default: [], index: true },

    // Publication / lifecycle
    published: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "draft", "archived"], default: "active", index: true },

    // SEO
    seo: { title: { type: String, default: "" }, description: { type: String, default: "" } },

    // Options + variants + images
    options: { type: [{ name: String, values: [String] }], default: [] },
    variants: { type: [VariantSchema], default: [] },
    images: { type: [ImageSchema], default: [] },

    // Denormalised storefront helpers (kept in sync on save)
    image: { type: String, default: "" }, // primary image src
    priceMin: { type: Number, default: 0 },
    priceMax: { type: Number, default: 0 },
    compareAtMax: { type: Number, default: 0 },
    totalInventory: { type: Number, default: 0 },

    // Storefront presentation (derived during import via taxonomy mapping)
    category: { type: String, default: "", index: true }, // internal handle e.g. "serum"
    categoryName: { type: String, default: "" }, // display e.g. "Serums"
    ingredient: { type: String, default: "" },
    skinTypes: { type: String, default: "" },
    color: { type: String, default: "#3056D3" },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },

    // Provenance
    source: { type: String, default: "shopify-csv" },
    importedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Full-text search across the fields the storefront search box targets.
CatalogProductSchema.index({ title: "text", tags: "text", vendor: "text", productType: "text", bodyHtml: "text" });

// Keep denormalised price/inventory/image fields in sync from variants+images.
CatalogProductSchema.pre("save", function () {
  const prices = this.variants.map((v) => v.price).filter((n) => n > 0);
  this.priceMin = prices.length ? Math.min(...prices) : 0;
  this.priceMax = prices.length ? Math.max(...prices) : 0;
  this.compareAtMax = this.variants.reduce((m, v) => Math.max(m, v.compareAt || 0), 0);
  this.totalInventory = this.variants.reduce((s, v) => s + (v.inventoryQty || 0), 0);
  if (this.images?.length) this.image = this.images[0].src;
});

export const CatalogProduct =
  mongoose.models.CatalogProduct || mongoose.model("CatalogProduct", CatalogProductSchema);
