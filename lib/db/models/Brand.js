// ============================================================================
// Brand — admin-managed storefront brand. Product count is derived live from
// CatalogProduct (by vendor/slug), never stored.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

const BrandSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    description: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

BrandSchema.pre("save", function () {
  if (!this.slug && this.name) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
});

export const Brand = mongoose.models.Brand || mongoose.model("Brand", BrandSchema);
