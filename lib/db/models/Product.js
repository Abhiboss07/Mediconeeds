// ============================================================================
// Product model — a seller's catalogue listing. Lifecycle via `status`:
//   draft → pending (seller submits) → active (admin approves) | rejected
//   active → archived (seller hides). Matches PRODUCT_STATUS in lib/seller/models.
// New/edited listings enter "pending" so an admin approves them before they go
// live (B2B marketplace policy).
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

export const PRODUCT_STATUSES = ["draft", "pending", "active", "rejected", "archived"];

const ProductSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", index: true },

    name: { type: String, required: true, trim: true },
    slug: { type: String, index: true },
    brand: { type: String, trim: true },
    sku: { type: String, trim: true, index: true },
    category: { type: String, trim: true, index: true },
    hsn: { type: String, trim: true },
    gst: { type: Number, default: 18 },

    // Pricing (INR)
    mrp: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    wholesale: { type: Number, default: 0 },
    moq: { type: Number, default: 1 },

    // Inventory
    stock: { type: Number, default: 0 },

    // Media & content
    images: { type: [String], default: [] },
    image: { type: String }, // convenience: primary image
    description: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    // Extended catalogue content (also populated by bulk upload).
    subcategory: { type: String, trim: true, default: "" },
    weight: { type: String, trim: true, default: "" }, // e.g. "50g", "100 ml"
    ingredients: { type: String, default: "" },
    howToUse: { type: String, default: "" },

    // SEO
    seo: { title: String, description: String, keywords: [String] },

    // Bulk import provenance (null for manually-added products). Lets the admin
    // surface a "Bulk Uploaded" badge and trace a product back to its batch.
    bulkBatch: { type: Schema.Types.ObjectId, ref: "ImportBatch", default: null, index: true },

    // Lifecycle / moderation
    status: { type: String, enum: PRODUCT_STATUSES, default: "draft", index: true },
    rejectionReason: { type: String },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    deleted: { type: Boolean, default: false, index: true },

    // Analytics (denormalised counters)
    views: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
  },
  { timestamps: true, optimisticConcurrency: true }
);

// Unique per seller, but only among LIVE products. A partial filter on
// `deleted: false` keeps soft-deleted tombstones out of the index, so a seller
// can re-create a product with the same name/slug after deleting one. (A plain
// unique index would keep the slug reserved forever and make re-adds — bulk or
// manual — fail with E11000.) Requires the migration in
// scripts/migrate-slug-index.mjs to replace the old plain index on existing DBs.
ProductSchema.index({ seller: 1, slug: 1 }, { unique: true, partialFilterExpression: { deleted: false } });

// Keep a URL-safe slug and a primary image in sync on save. (Mongoose 9 pre
// hooks are promise-based — no `next` callback.)
ProductSchema.pre("save", function () {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  if (!this.image && this.images?.length) this.image = this.images[0];
});

export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

// ============================================================================
// Publish Bridge: syncs approved Product to CatalogProduct storefront
// ============================================================================
import { CatalogProduct } from "./CatalogProduct.js";
import { AuditLog } from "./AuditLog.js";
import { getPresentation } from "../../catalog/taxonomy.js";

export async function publishProductToCatalog(product, session = null, actorId = null) {
  const isActive = product.status === "active" && product.deleted !== true;
  
  let doc = await CatalogProduct.findOne({ handle: product.slug }).session(session);
  const oldStatus = doc ? doc.status : null;
  const newStatus = isActive ? "active" : "archived";

  if (!doc) {
    if (!isActive) {
      console.log(`[PUBLISH_BRIDGE] [SKIP] Product ${product.slug} is inactive/deleted; skipping catalog creation.`);
      return;
    }
    doc = new CatalogProduct({ handle: product.slug });
  }

  if (isActive) {
    const pres = getPresentation(product.category, [], product.name);
    
    doc.title = product.name;
    doc.bodyHtml = product.description || "";
    doc.vendor = product.brand || "Dr. Awish";
    doc.productType = product.category || "Skincare";
    doc.published = true;
    doc.status = "active";
    doc.seo = {
      title: product.seo?.title || product.name,
      description: product.seo?.description || product.shortDescription || "",
    };
    doc.variants = [
      {
        sku: product.sku || "",
        barcode: "",
        title: "Default Title",
        option1: "Default Title",
        option2: "",
        option3: "",
        price: product.price || 0,
        compareAt: product.mrp || 0,
        grams: 0,
        weightUnit: "g",
        inventoryQty: product.stock || 0,
        inventoryPolicy: "deny",
        inventoryTracker: "shopify",
        fulfillmentService: "manual",
        requiresShipping: true,
        taxable: true,
        imageSrc: product.image || (product.images && product.images[0]) || "",
        position: 1,
      },
    ];
    doc.images = (product.images || []).map((src, idx) => ({
      src,
      position: idx + 1,
      alt: product.name,
    }));
    doc.category = pres.category;
    doc.categoryName = pres.categoryName;
    doc.color = pres.color;
    doc.ingredient = pres.ingredient;
    doc.skinTypes = pres.skinTypes;
    doc.rating = product.rating || 0;
    doc.reviews = product.sales || 0;
    doc.source = "seller";
  } else {
    // Unpublish
    doc.published = false;
    doc.status = "archived";
  }

  await doc.save({ session });

  // Log in AuditLog
  await AuditLog.create(
    [
      {
        action: isActive ? "publish" : "unpublish",
        actor: actorId,
        productId: product._id,
        catalogId: product.slug,
        status: doc.status,
        oldStatus,
        newStatus,
        diff: {
          isActive,
          price: product.price,
          stock: product.stock,
        },
      },
    ],
    session ? { session } : {}
  );

  console.log(`[PUBLISH_BRIDGE] [SUCCESS] ${isActive ? "Published" : "Unpublished"} CatalogProduct for handle: ${product.slug}`);
}

