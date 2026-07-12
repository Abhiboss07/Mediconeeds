// ============================================================================
// Workshop model — a dermatology / clinical skills workshop advertised on the
// public /workshops page. "upcoming" vs "past" is derived from `startsAt` at
// read time so a single seed stays correct as time passes. Registrations are a
// separate lightweight collection so the workshop doc doesn't grow unbounded.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

const FaqSchema = new Schema({ q: String, a: String }, { _id: false });

const WorkshopSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    summary: { type: String, default: "" },
    description: { type: String, default: "" },

    startsAt: { type: Date, required: true, index: true },
    durationLabel: { type: String, default: "1 day" }, // e.g. "2 days", "4 hours"
    venue: { type: String, default: "" },
    city: { type: String, default: "" },
    price: { type: Number, default: 0 }, // 0 = free
    seatsTotal: { type: Number, default: 30 },

    image: { type: String, default: "" },
    highlights: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    faqs: { type: [FaqSchema], default: [] },

    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Workshop = mongoose.models.Workshop || mongoose.model("Workshop", WorkshopSchema);

const WorkshopRegistrationSchema = new Schema(
  {
    workshop: { type: Schema.Types.ObjectId, ref: "Workshop", required: true, index: true },
    workshopTitle: { type: String, default: "" },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    organisation: { type: String, default: "", trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

WorkshopRegistrationSchema.index({ workshop: 1, email: 1 }, { unique: true });

export const WorkshopRegistration =
  mongoose.models.WorkshopRegistration || mongoose.model("WorkshopRegistration", WorkshopRegistrationSchema);
