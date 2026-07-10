import { Suspense } from "react";
import SiteChrome from "@/components/SiteChrome";
import OrderSuccessView from "@/components/checkout/OrderSuccessView";

export const metadata = { title: "Order Confirmed" };

export default function Page() {
  return (
    <SiteChrome content={
      <Suspense fallback={<div className="py-16 text-center text-[#6b7280]">Loading…</div>}>
        <OrderSuccessView />
      </Suspense>
    } />
  );
}
