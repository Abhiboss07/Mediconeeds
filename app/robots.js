import { site } from "@/lib/site";

// Allow crawling of the public storefront; keep portals/checkout/api private.
export default function robots() {
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/seller/", "/admin/", "/account/", "/checkout", "/order-success", "/api/"],
    }],
    sitemap: `${site.seo.canonical}/sitemap.xml`,
  };
}
