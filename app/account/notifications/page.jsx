import AccountShell from "@/components/AccountShell";
import NotificationsList from "@/components/account/NotificationsList";

export const metadata = { title: "Notifications" };

export default function Page() {
  return (
    <AccountShell active="/account/notifications" title="Notifications">
      <NotificationsList />
    </AccountShell>
  );
}
