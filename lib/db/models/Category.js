// ============================================================================
// Category — admin-managed storefront category. Product count is derived live
// from CatalogProduct (by slug/name), never stored.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    image: { type: String, default: "" },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    displayOrder: { type: Number, default: 0, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CategorySchema.pre("save", function () {
  if (!this.slug && this.name) this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
});

export const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
