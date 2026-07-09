// ============================================================================
// Order model — a B2B purchase from one seller. Lifecycle via `status`:
//   new → confirmed → packed → shipped → delivered  (or → cancelled)
// Seller advances the status; buyer sees their own order history. Real orders
// will be created by checkout (later phase); for now they're seeded.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

export const ORDER_STATUSES = ["new", "confirmed", "packed", "shipped", "delivered", "cancelled"];
export const ORDER_FLOW = { new: "confirmed", confirmed: "packed", packed: "shipped", shipped: "delivered", delivered: null, cancelled: null };
export const PAYMENT_STATUSES = ["paid", "cod", "pending"];

const ItemSchema = new Schema(
  { product: { type: Schema.Types.ObjectId, ref: "Product" }, name: String, sku: { type: String, default: "" }, qty: { type: Number, default: 1 }, price: { type: Number, default: 0 } },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true, index: true },
    seller: { type: Schema.Types.ObjectId, ref: "Seller", index: true },
    buyer: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true }, // null for seeded demo orders
    buyerName: { type: String, trim: true }, // B2B account display name

    items: { type: [ItemSchema], default: [] },
    amount: { type: Number, default: 0 },

    status: { type: String, enum: ORDER_STATUSES, default: "new", index: true },
    payment: { type: String, enum: PAYMENT_STATUSES, default: "pending" },
    paymentMethod: { type: String, default: "" }, // upi | card | netbanking | cod
    razorpayOrderId: { type: String, default: "" },
    // No default: unpaid/COD orders leave this ABSENT so the sparse-unique index
    // skips them (an empty-string default would be indexed and collide across orders).
    paymentId: { type: String },
    tracking: { type: String, default: "" },

    placedAt: { type: Date, default: Date.now },
    statusHistory: { type: [{ status: String, at: Date }], default: [] },
  },
  { timestamps: true }
);

OrderSchema.index({ paymentId: 1 }, { unique: true, sparse: true });

export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
