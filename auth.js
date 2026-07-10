// ============================================================================
// Auth.js instance (Node runtime). Providers:
//   • credentials  — email + password (buyers, sellers, admins)
//   • otp          — passwordless login via a verified email/SMS OTP
//   • google       — OAuth (only enabled when AUTH_GOOGLE_ID/SECRET are set)
// Sessions are JWT (no DB adapter); Google users are upserted into Mongo in the
// signIn callback so every session maps to a real User with a role.
// ============================================================================
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import crypto from "crypto";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { dbConnect } from "./lib/db/mongoose";
import { User } from "./lib/db/models/User";
import { Seller } from "./lib/db/models/Seller";
import { verifyOtp } from "./lib/auth/otp";
import { config, isGoogleEnabled } from "./lib/config";

const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

/** Resolve a seller's approval status (null for non-sellers). */
async function sellerStatusFor(user) {
  if (user.role !== "seller") return null;
  const s = await Seller.findOne({ user: user._id }).select("approval").lean();
  return s?.approval ?? "pending";
}

/** Find a user by email or by the last 10 digits of a phone number. */
function userQuery(identifier, channel) {
  if (channel === "email") return { email: String(identifier).toLowerCase().trim() };
  const last10 = String(identifier).replace(/\D/g, "").slice(-10);
  return { phone: { $regex: last10 + "$" } };
}

const providers = [
  Credentials({
    id: "credentials",
    credentials: { email: {}, password: {} },
    async authorize(raw) {
      const parsed = LoginSchema.safeParse(raw);
      if (!parsed.success) return null;
      await dbConnect();
      const user = await User.findForAuth(parsed.data.email);
      if (!user || user.status !== "active") return null;
      if (!(await user.verifyPassword(parsed.data.password))) return null;
      User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }).catch(() => {});
      return { id: String(user._id), name: user.name, email: user.email, role: user.role, sellerStatus: await sellerStatusFor(user) };
    },
  }),

  Credentials({
    id: "otp",
    name: "OTP",
    credentials: { identifier: {}, channel: {}, code: {}, purpose: {}, mode: {}, name: {}, phone: {} },
    async authorize(raw) {
      const { identifier, channel, code, mode = "login", name, phone } = raw || {};
      if (!identifier || !channel || !code) return null;
      const purpose = mode === "signup" ? "signup" : "login";
      const res = await verifyOtp({ identifier, channel, purpose, code });
      if (!res.ok) return null;

      await dbConnect();
      let user = await User.findOne(userQuery(identifier, channel));

      // Passwordless signup: create a buyer once the code is verified.
      if (!user && mode === "signup") {
        const email = channel === "email" ? String(identifier).toLowerCase().trim() : String(raw.email || "").toLowerCase().trim();
        if (!email) return null; // email is our unique key; required to create an account
        user = new User({
          name: (name && name.trim()) || email,
          email,
          phone: (phone && phone.trim()) || (channel === "sms" ? identifier : undefined),
          role: "buyer",
          emailVerified: channel === "email" ? new Date() : undefined,
        });
        await user.setPassword(crypto.randomBytes(24).toString("hex")); // unusable until they set one
        await user.save();
      }

      if (!user || user.status !== "active") return null;
      User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }).catch(() => {});
      return { id: String(user._id), name: user.name, email: user.email, role: user.role, sellerStatus: await sellerStatusFor(user) };
    },
  }),
];

// Google is optional — only attach it when GOOGLE_CLIENT_ID/SECRET are set.
if (isGoogleEnabled()) {
  providers.push(Google({ clientId: config.google.clientId, clientSecret: config.google.clientSecret }));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    // Upsert Google users into Mongo and attach id/role so the token is complete.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const email = String(user.email || profile?.email || "").toLowerCase();
      if (!email) return false;
      await dbConnect();
      let u = await User.findOne({ email });
      if (!u) {
        u = new User({ name: user.name || profile?.name || email, email, role: "buyer", emailVerified: new Date() });
        await u.setPassword(crypto.randomBytes(24).toString("hex")); // unusable local password
        await u.save();
      }
      // Mutate the user ref so the jwt callback embeds our identifiers.
      user.id = String(u._id);
      user.role = u.role;
      user.sellerStatus = await sellerStatusFor(u);
      return true;
    },
  },
});
