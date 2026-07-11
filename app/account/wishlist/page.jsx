import AccountShell from "@/components/AccountShell";
import WishlistGrid from "@/components/account/WishlistGrid";
import { currentBuyer } from "@/lib/account/current";
import { CatalogProduct } from "@/lib/db/models/CatalogProduct";

export const metadata = { title: "Wishlist" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const buyer = await currentBuyer();
  const handles = buyer && Array.isArray(buyer.wishlist) ? buyer.wishlist : [];
  let items = [];
  if (handles.length) {
    const products = await CatalogProduct.find({ handle: { $in: handles } }).select("handle title image priceMin").lean();
    const byHandle = new Map(products.map((p) => [p.handle, p]));
    items = handles
      .map((h) => byHandle.get(h))
      .filter(Boolean)
      .map((p) => ({ handle: p.handle, title: p.title, image: p.image, price: p.priceMin || 0 }));
  }
  return (
    <AccountShell active="/account/wishlist" title="Wishlist">
      <WishlistGrid initial={items} />
    </AccountShell>
  );
}
