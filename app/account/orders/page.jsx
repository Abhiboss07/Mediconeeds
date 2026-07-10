import AccountShell from "@/components/AccountShell";
import OrdersList from "@/components/account/OrdersList";

export const metadata = { title: "My Orders" };

export default function Page() {
  return (
    <AccountShell active="/account/orders" title="My Orders">
      <OrdersList />
    </AccountShell>
  );
}
