import SiteChrome from "@/components/SiteChrome";
import { getStorefrontProductByHandle, getStorefrontProducts } from "@/lib/catalog/store";
import ProductView from "./ProductView";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getStorefrontProductByHandle(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: `${product.title} — Mediconeeds`,
    description: product.shortDesc || product.title,
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const product = await getStorefrontProductByHandle(slug);
  if (!product) {
    notFound();
  }

  // Related (same category) + more-from-brand (same vendor) — all from MongoDB.
  const allProducts = await getStorefrontProducts();
  const others = allProducts.filter((p) => p.slug !== product.slug);
  const sameCat = others.filter((p) => p.category === product.category);
  const similar = (sameCat.length ? sameCat : others).slice(0, 10);
  const brandProducts = others.filter((p) => p.brand && p.brand === product.brand).slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images?.length ? product.images : [product.image].filter(Boolean),
    description: product.shortDesc || product.title,
    sku: product.variants?.[0]?.sku || product.slug,
    brand: { "@type": "Brand", name: product.brand || "Dr Awish" },
    ...(product.reviews
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating || 4.5, reviewCount: product.reviews } }
      : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <SiteChrome
      content={
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
          <ProductView product={product} similar={similar} brandProducts={brandProducts} />
        </>
      }
    />
  );
}
