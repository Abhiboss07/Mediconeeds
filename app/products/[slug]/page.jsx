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

  return (
    <SiteChrome
      content={<ProductView product={product} related={related} />}
    />
  );
}
