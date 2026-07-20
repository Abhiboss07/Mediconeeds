/** @type {import('next').NextConfig} */

// Content-Security-Policy. Scoped to the origins the app actually uses: self for
// scripts/styles/fonts, the Razorpay checkout widget + its API/frames for
// payments, and data:/https: images (catalogue SVGs + data-URI avatars). Next's
// hydration and the reused compiled CSS require 'unsafe-inline'; 'unsafe-eval'
// is intentionally NOT granted. object/base/form/frame-ancestors are locked down
// to blunt injection, clickjacking and base-tag hijacking.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.razorpay.com https://lumberjack.razorpay.com",
  // Razorpay checkout frames + the Google Maps embed on /contact.
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://www.google.com https://maps.google.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

// Security headers applied to every response. HSTS only takes effect over HTTPS,
// so it is harmless in dev/http and behind a TLS-terminating reverse proxy.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false, // don't advertise Next.js
  compress: true, // gzip responses (the reverse proxy can also handle this)
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
