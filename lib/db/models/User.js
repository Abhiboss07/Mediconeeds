// ============================================================================
// User model — the identity record for every human on the platform.
// One User has exactly one role. Sellers additionally get a Seller profile
// (see Seller.js) linked by `user`. Passwords are stored only as bcrypt hashes.
// ============================================================================
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

export const USER_ROLES = ["buyer", "seller", "admin", "superadmin"];
export const USER_STATUS = ["active", "suspended", "deleted"];
export const USER_GENDERS = ["male", "female", "other", "unspecified"];

// A saved shipping address (subdocument of User). Buyers manage these from the
// account portal; checkout can preselect the default.
const AddressSchema = new Schema(
  {
    label: { type: String, trim: true, default: "Home" }, // Home | Work | …
    name: { type: String, trim: true, default: "" },
    line: { type: String, trim: true, default: "" }, // full address text
    phone: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },

    // Never returned by default — `select: false` keeps the hash out of queries.
    passwordHash: { type: String, required: true, select: false },

    role: { type: String, enum: USER_ROLES, default: "buyer", index: true },
    status: { type: String, enum: USER_STATUS, default: "active" },

    // --- Buyer profile (account portal) -------------------------------------
    avatarUrl: { type: String, default: "" },
    dob: { type: Date, default: null },
    gender: { type: String, enum: USER_GENDERS, default: "unspecified" },
    // Loyalty balance. New accounts start at 0 — never seed a fake balance.
    rewardPoints: { type: Number, default: 0, min: 0 },
    // Wishlist = CatalogProduct handles (stable, URL-friendly keys).
    wishlist: { type: [String], default: [] },
    addresses: { type: [AddressSchema], default: [] },

    emailVerified: { type: Date, default: null },
    // Hashed tokens (never store the raw token). Consumed on verify/reset.
    verifyTokenHash: { type: String, select: false },
    verifyTokenExp: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExp: { type: Date, select: false },

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// --- Password helpers -------------------------------------------------------
UserSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 12);
};

UserSchema.methods.verifyPassword = async function (plain) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plain, this.passwordHash);
};

/** Static helper: look up a user *with* the password hash for login checks. */
UserSchema.statics.findForAuth = function (email) {
  return this.findOne({ email: String(email).toLowerCase().trim() }).select("+passwordHash");
};

export const User = mongoose.models.User || mongoose.model("User", UserSchema);
