// ============================================================================
// Centralized configuration — the single place every secret / third-party
// setting is read from process.env. Import `config` (or a feature flag) instead
// of touching process.env directly, so adding a provider or moving between
// dev/staging/prod is a one-file change. Edge-safe (only reads process.env).
// ============================================================================

const bool = (v, dflt = false) => (v == null ? dflt : v !== "false" && v !== "0");
const num = (v, dflt) => (v == null || v === "" ? dflt : Number(v));

export const config = {
  // Core
  mongodbUri: process.env.MONGODB_URI || "",
  authSecret: process.env.AUTH_SECRET || "",
  authUrl: process.env.AUTH_URL || "http://localhost:3000",

  // Demo rollout
  demo: { enabled: bool(process.env.DEMO_MODE, true), role: process.env.DEMO_ROLE || "seller" },

  // Email over SMTP (Nodemailer)
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: num(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Mediconeeds <no-reply@mediconeeds.com>",
    secure: bool(process.env.SMTP_SECURE, false), // true for port 465
  },

  // SMS OTP (MSG91)
  msg91: {
    authKey: process.env.MSG91_AUTH_KEY || "",
    senderId: process.env.MSG91_SENDER_ID || "MEDICO",
    templateId: process.env.MSG91_OTP_TEMPLATE_ID || "",
  },

  // Google OAuth
  google: { clientId: process.env.GOOGLE_CLIENT_ID || "", clientSecret: process.env.GOOGLE_CLIENT_SECRET || "" },

  // Payments (Razorpay) — wired in a later phase
  razorpay: { keyId: process.env.RAZORPAY_KEY_ID || "", keySecret: process.env.RAZORPAY_KEY_SECRET || "" },

  // Shopify import — wired in a later phase
  shopify: { storeDomain: process.env.SHOPIFY_STORE_DOMAIN || "", adminToken: process.env.SHOPIFY_ADMIN_TOKEN || "" },

  // File storage (local now; S3-compatible later)
  storage: {
    driver: process.env.STORAGE_DRIVER || "local",
    s3: {
      endpoint: process.env.S3_ENDPOINT || "",
      bucket: process.env.S3_BUCKET || "",
      region: process.env.S3_REGION || "",
      accessKey: process.env.S3_ACCESS_KEY || "",
      secretKey: process.env.S3_SECRET_KEY || "",
    },
  },

  // OTP tuning
  otp: { ttlSeconds: num(process.env.OTP_TTL_SECONDS, 300), maxPerHour: num(process.env.OTP_MAX_PER_HOUR, 5) },
};

// --- Feature flags: is a provider configured? ------------------------------
export const isGoogleEnabled = () => Boolean(config.google.clientId && config.google.clientSecret);
export const isSmtpConfigured = () => Boolean(config.smtp.host && config.smtp.user);
export const isSmsConfigured = () => Boolean(config.msg91.authKey);
export const isRazorpayConfigured = () => Boolean(config.razorpay.keyId && config.razorpay.keySecret);
export const isDemoMode = () => config.demo.enabled;
