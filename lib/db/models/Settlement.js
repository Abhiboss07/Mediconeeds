// ============================================================================
// Settlement model — one payout-cycle settlement of a seller's earnings.
// Generated from delivered/paid Orders (see scripts/seed-settlements.mjs): each
// record captures the gross sales, platform commission, GST on that commission
// and the net payable for a fixed weekly cycle. This is the source of truth for
// the seller Wallet screen and the downloadable GST report / invoices.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

export const SETTLEMENT_STATUSES = ["upcoming", "processing", "paid"];

const SettlementSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },

    settlementNo: { type: String, required: true, unique: true, index: true }, // STL-XXXXX
    invoiceNo: { type: String, required: true }, // INV-XXXX-YYYY

    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    settledOn: { type: Date, default: null }, // when it actually paid out

    orderCount: { type: Number, default: 0 },
    gross: { type: Number, default: 0 }, // gross sales in the cycle
    commissionRate: { type: Number, default: 8 }, // % platform commission
    commission: { type: Number, default: 0 }, // gross * rate
    gstRate: { type: Number, default: 18 }, // % GST charged on the commission
    gstOnCommission: { type: Number, default: 0 }, // commission * gstRate
    net: { type: Number, default: 0 }, // gross - commission - gstOnCommission

    status: { type: String, enum: SETTLEMENT_STATUSES, default: "upcoming", index: true },
    txnRef: { type: String, default: "" }, // bank/UTR reference once paid
  },
  { timestamps: true }
);

export const Settlement = mongoose.models.Settlement || mongoose.model("Settlement", SettlementSchema);
