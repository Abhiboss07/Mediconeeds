// ============================================================================
// Withdrawal model — a seller's request to move available wallet balance to
// their bank. Lifecycle: pending → approved → paid (or → rejected). The admin
// panel drives the transitions; the seller sees a status timeline. Available
// balance is derived from paid Settlements minus paid/reserved Withdrawals, so
// a seller can never request more than they have (validated at creation).
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

export const WITHDRAWAL_STATUSES = ["pending", "approved", "paid", "rejected"];

const TimelineSchema = new Schema(
  { status: { type: String }, at: { type: Date, default: Date.now }, note: { type: String, default: "" } },
  { _id: false }
);

const WithdrawalSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    sellerName: { type: String, default: "" }, // denormalised for admin list
    sellerEmail: { type: String, default: "" },

    amount: { type: Number, required: true, min: 1 },
    bank: {
      bankName: { type: String, trim: true, default: "" },
      account: { type: String, trim: true, default: "" },
      ifsc: { type: String, trim: true, uppercase: true, default: "" },
    },
    remark: { type: String, default: "", trim: true, maxlength: 300 },

    status: { type: String, enum: WITHDRAWAL_STATUSES, default: "pending", index: true },
    reference: { type: String, required: true, unique: true, index: true }, // WD-XXXXXX

    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: "" },
    paidAt: { type: Date, default: null },
    txnRef: { type: String, default: "" }, // UTR/bank reference when marked paid

    timeline: { type: [TimelineSchema], default: [] },
  },
  { timestamps: true }
);

export const Withdrawal = mongoose.models.Withdrawal || mongoose.model("Withdrawal", WithdrawalSchema);
