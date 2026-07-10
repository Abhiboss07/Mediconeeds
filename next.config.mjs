/** @type {import('next').NextConfig} */

// Security headers applied to every response. HSTS only takes effect over HTTPS,
// so it is harmless in dev/http and behind a TLS-terminating reverse proxy. CSP
// is intentionally omitted here (Razorpay checkout + inline styles/JSON need a
// carefully-scoped policy) — add it at the proxy or per-route once external
// origins are frozen.
const securityHeaders = [
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
