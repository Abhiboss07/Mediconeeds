import mongoose from "mongoose";

const { Schema } = mongoose;

const EmailOutboxSchema = new Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String },
    html: { type: String },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending", index: true },
    attempts: { type: Number, default: 0 },
    error: { type: String },
  },
  { timestamps: true }
);

export const EmailOutbox = mongoose.models.EmailOutbox || mongoose.model("EmailOutbox", EmailOutboxSchema);
