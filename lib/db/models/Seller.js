// ============================================================================
// Seller model — a business profile owned by a User with role "seller".
// Created when someone completes the 6-step registration wizard. Starts in
// "pending" and only unlocks the dashboard/product upload once an admin
// approves it (see the seller-approval flow in app/admin/sellers).
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

export const SELLER_APPROVAL = ["pending", "approved", "rejected", "suspended"];

const SellerSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },

    // Business identity (from RegisterWizard step 1–2)
    company: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    gst: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },
    cin: { type: String, trim: true, uppercase: true },
    address: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    website: { type: String, trim: true },

    // Settlement bank (step 3)
    bank: {
      bankName: { type: String, trim: true },
      account: { type: String, trim: true },
      ifsc: { type: String, trim: true, uppercase: true },
    },

    // Catalogue focus (step 4)
    categories: { type: [String], default: [] },

    // Uploaded KYC docs (step 5) — store references/URLs, not the files.
    documents: {
      gstCert: { type: String },
      panDoc: { type: String },
      cheque: { type: String },
      license: { type: String },
    },

    // Approval workflow
    approval: { type: String, enum: SELLER_APPROVAL, default: "pending", index: true },
    applicationRef: { type: String, index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String },

    // Storefront presentation
    displayName: { type: String, trim: true },
    rating: { type: Number, default: 0 },

    // Incremental aggregated stats
    stats: {
      totalOrders: { type: Number, default: 0 },
      revenue: { type: Number, default: 0 },
      pendingOrders: { type: Number, default: 0 },
      totalProducts: { type: Number, default: 0 },
      inventoryValue: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Seller = mongoose.models.Seller || mongoose.model("Seller", SellerSchema);
