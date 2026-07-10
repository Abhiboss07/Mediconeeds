import mongoose from "mongoose";

const { Schema } = mongoose;

const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true }, // 'publish', 'unpublish', 'soft_delete', 'stock_decrement'
    actor: { type: Schema.Types.ObjectId, ref: "User", index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", index: true },
    catalogId: { type: String, index: true }, // handle
    status: { type: String },
    oldStatus: { type: String },
    newStatus: { type: String },
    diff: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", AuditLogSchema);
