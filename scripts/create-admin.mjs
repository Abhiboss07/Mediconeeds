// ============================================================================
// Bootstrap the first admin account. Reads ADMIN_EMAIL / ADMIN_PASSWORD from
// the environment (.env.local) and upserts a superadmin User.
//
//   node --env-file=.env.local scripts/create-admin.mjs
//
// Safe to re-run: updates the password if the account already exists.
// ============================================================================
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!MONGODB_URI) { console.error("✗ MONGODB_URI not set"); process.exit(1); }
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) { console.error("✗ ADMIN_EMAIL / ADMIN_PASSWORD not set"); process.exit(1); }

const UserSchema = new mongoose.Schema(
  { name: String, email: { type: String, unique: true }, passwordHash: String, role: String, status: String, emailVerified: Date },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

await mongoose.connect(MONGODB_URI);
const email = ADMIN_EMAIL.toLowerCase().trim();
const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

const res = await User.findOneAndUpdate(
  { email },
  { $set: { name: "Administrator", role: "superadmin", status: "active", passwordHash, emailVerified: new Date() } },
  { upsert: true, new: true }
);

console.log(`✓ Admin ready: ${res.email} (role=${res.role})`);
await mongoose.disconnect();
process.exit(0);
