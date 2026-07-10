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
    title: `${product.title} — Medikabazaar`,
    description: product.shortDesc || product.title,
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const product = await getStorefrontProductByHandle(slug);
  if (!product) {
    notFound();
  }

  // Fetch related products from the same category handle
  const allProducts = await getStorefrontProducts();
  const related = allProducts
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, 4);

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
          <ProductView product={product} related={related} />
        </>
      }
    />
  );
}
