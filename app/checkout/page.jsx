import SiteChrome from "@/components/SiteChrome";
import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata = { title: "Checkout" };

export default function Page() {
  return <SiteChrome content={<CheckoutView />} />;
}
