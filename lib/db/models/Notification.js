// ============================================================================
// Notification — an in-app message for one user (seller or buyer). Created by
// the notify() service on key events (order placed, product/seller approved,
// etc.), which may also send an email. Rendered in the seller & account portals.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

export const NOTIFICATION_TYPES = ["order", "stock", "approval", "rejected", "message", "announcement", "payment", "system"];

const NotificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "system" },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

/** Human-friendly relative time, e.g. "2h ago". */
export function relativeTime(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7); if (w < 5) return `${w}w ago`;
  return new Date(date).toLocaleDateString("en-IN");
}
