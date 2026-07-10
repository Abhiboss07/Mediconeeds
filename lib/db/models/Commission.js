// ============================================================================
// Commission — singleton marketplace commission settings. One document keyed
// by `key: "global"`. Holds the global rate, GST, platform fee, per-category
// rates and per-seller overrides. Resolution: seller override → category rate →
// global rate.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

const CommissionSchema = new Schema(
  {
    key: { type: String, default: "global", unique: true, index: true },
    global: { type: Number, default: 8, min: 0, max: 100 },
    gst: { type: Number, default: 18, min: 0, max: 100 },
    platformFee: { type: Number, default: 2, min: 0, max: 100 },
    categoryRates: { type: [{ category: String, rate: Number }], default: [] },
    sellerOverrides: { type: [{ sellerId: String, sellerName: String, rate: Number }], default: [] },
  },
  { timestamps: true }
);

export const Commission = mongoose.models.Commission || mongoose.model("Commission", CommissionSchema);

// Resolve the effective commission % for a given seller/category.
export function resolveCommission(doc, { sellerId, category } = {}) {
  if (!doc) return 8;
  const so = doc.sellerOverrides?.find((s) => String(s.sellerId) === String(sellerId));
  if (so && so.rate != null) return so.rate;
  const cr = doc.categoryRates?.find((c) => c.category === category);
  if (cr && cr.rate != null) return cr.rate;
  return doc.global ?? 8;
}
