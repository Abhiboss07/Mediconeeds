// ============================================================================
// Banner — admin-managed marketing banner (hero / offer / slider / homepage).
// A banner is "live" when active AND within its optional start/end window.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

export const BANNER_TYPES = ["hero", "slider", "offer", "homepage"];

const BannerSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: BANNER_TYPES, default: "hero", index: true },
    desktopImage: { type: String, default: "" },
    mobileImage: { type: String, default: "" },
    link: { type: String, default: "" },
    priority: { type: Number, default: 0, index: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// A banner is currently live if active and within its (optional) date window.
BannerSchema.methods.isLive = function () {
  if (!this.active) return false;
  const now = Date.now();
  if (this.startDate && this.startDate.getTime() > now) return false;
  if (this.endDate && this.endDate.getTime() < now) return false;
  return true;
};

export const Banner = mongoose.models.Banner || mongoose.model("Banner", BannerSchema);
