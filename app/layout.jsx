// Tailwind utilities for hand-written pages — loaded FIRST so the cloned
// compiled CSS (below) wins on any shared utility (e.g. lg:flex/hidden) and the
// fragments keep their exact responsive behaviour; our unique arbitrary classes
// (grid-cols-[280px_1fr], etc.) aren't in the compiled CSS so they still apply.
import "./generated.css";
// Reuse the original compiled CSS in its exact load order for byte-for-byte
// fidelity (Tailwind base + utilities + styled-components hashes + Swiper).
import "./styles/624ba3dffd8d56ae.css";
import "./styles/2eb00ab5d714f5ca.css";
import "./styles/ef46db3751d8e999.css";
import "./styles/56c1b82c248d78d9.css";
import "./styles/454bf7671580d9b7.css";
import "./globals.css";
// Recovered styled-components rules (injected at runtime on the live site).
import "./styles/_recovered.css";
// Graceful responsive degradation for the desktop-only snapshot.
import "./responsive.css";
// Phase 2.1 UI/UX polish.
import "./polish.css";

import { site } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(site.seo.canonical),
  title: {
    default: site.seo.title,
    template: `%s | ${site.brand.name}`,
  },
  description: site.seo.description,
  keywords: site.seo.keywords,
  applicationName: site.brand.name,
  alternates: { canonical: site.seo.canonical },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    siteName: site.brand.name,
    title: site.seo.title,
    description: site.seo.description,
    url: site.seo.canonical,
    locale: site.seo.locale,
    images: [{ url: site.seo.ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    title: site.seo.title,
    description: site.seo.description,
    images: [site.seo.ogImage],
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
