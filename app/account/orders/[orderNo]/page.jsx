import AccountShell from "@/components/AccountShell";
import OrderTracking from "@/components/account/OrderTracking";

export const metadata = { title: "Order Tracking" };

export default async function Page({ params }) {
  const { orderNo } = await params;
  return (
    <AccountShell active="/account/orders" title={`Order ${orderNo}`}>
      <OrderTracking orderNo={orderNo} />
    </AccountShell>
  );
}
