// ============================================================================
// CATALOG — reads ONLY from the isolated data layer in /data/catalog/*.json.
// No product data is hardcoded here. To swap in the real Shopify catalog,
// run `npm run import:csv` (see scripts/import-shopify-csv.mjs) which regenerates
// these JSON files from a Shopify product CSV — no UI/code changes required.
// ============================================================================
import categoriesData from "@/data/catalog/categories.json";
import ingredientsData from "@/data/catalog/ingredients.json";
import collectionsData from "@/data/catalog/collections.json";
import productsData from "@/data/catalog/catalog.json";

export const categories = categoriesData;
export const ingredients = ingredientsData;
export const featuredCollections = collectionsData.featuredCollections || [];
export const concerns = collectionsData.concerns || [];
export const products = productsData;
export const realProducts = products.filter((p) => p.real);

export const brands = ingredients; // single brand (Dr Awish) → feature ingredients

export const fmtINR = (n) => "₹" + Number(n).toLocaleString("en-IN");

export const getProducts = (n) => (n ? products.slice(0, n) : products);
export const getByCategory = (handle, n) =>
  products.filter((p) => p.category === handle).slice(0, n || 999);
export const getProductBySlug = (slug) =>
  products.find((p) => p.slug === slug) || products[0];
export const getCategories = () => categories;

export default { categories, ingredients, products, brands, concerns, featuredCollections, getProducts, getByCategory, getProductBySlug };
