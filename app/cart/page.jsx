import SiteChrome from "@/components/SiteChrome";
import CartView from "@/components/cart/CartView";

export const metadata = { title: "Cart" };

export default function Page() {
  return <SiteChrome content={<CartView />} />;
}
