import PlpPage from "@/components/PlpPage";

export const dynamic = "force-dynamic"; // live catalogue from MongoDB

export const metadata = {
  title: "Shop All Skincare",
  description: "Browse the full Dr Awish clinical skincare range — serums, sunscreens, cleansers, moisturisers and combos. Filter by category, ingredient, price and rating.",
};

export default function Page() { return <PlpPage />; }
