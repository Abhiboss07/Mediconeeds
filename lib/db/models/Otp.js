// ============================================================================
// One-time passcode records. Codes are stored only as sha256 hashes. A TTL
// index on `expiresAt` lets MongoDB purge expired codes automatically. Used for
// OTP login, signup/email verification, password reset, and seller verification.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

export const OTP_CHANNELS = ["email", "sms"];
export const OTP_PURPOSES = ["login", "signup", "reset", "seller_verify"];

const OtpSchema = new Schema(
  {
    identifier: { type: String, required: true, index: true }, // email (lowercase) or normalised phone
    channel: { type: String, enum: OTP_CHANNELS, required: true },
    purpose: { type: String, enum: OTP_PURPOSES, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 }, // wrong-guess counter
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-delete documents once expired (MongoDB TTL monitor).
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Fast lookup of the active code for an identifier+purpose.
OtpSchema.index({ identifier: 1, purpose: 1, consumedAt: 1 });

export const Otp = mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
