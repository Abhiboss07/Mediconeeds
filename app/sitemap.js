import { site } from "@/lib/site";
import { getStorefrontProducts } from "@/lib/catalog/store";

export const dynamic = "force-dynamic"; // product URLs come live from MongoDB

// Public storefront sitemap. Portal/account/checkout routes are intentionally
// excluded (see robots.js).
export default async function sitemap() {
  const base = site.seo.canonical;
  const products = await getStorefrontProducts();
  const now = new Date();
  const staticPaths = [
    "", "/shop", "/products", "/offers", "/bestsellers", "/export", "/become-seller",
    "/contact", "/about", "/faq", "/consultation", "/skin-analysis",
    "/policy/privacy", "/policy/terms", "/policy/returns", "/policy/shipping",
  ];
  const routes = staticPaths.map((p) => ({
    url: base + p,
    lastModified: now,
    changeFrequency: p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.7,
  }));
  const productRoutes = products.map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));
  return [...routes, ...productRoutes];
}
