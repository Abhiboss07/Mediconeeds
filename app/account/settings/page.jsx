import AccountShell from "@/components/AccountShell";
import ProfileSettings from "@/components/account/ProfileSettings";
import { currentBuyer } from "@/lib/account/current";

export const metadata = { title: "Account Settings" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const buyer = await currentBuyer();
  const initial = {
    name: buyer?.name || "",
    email: buyer?.email || "",
    phone: buyer?.phone || "",
    gender: buyer?.gender || "unspecified",
    dob: buyer?.dob ? new Date(buyer.dob).toISOString().slice(0, 10) : "",
    avatarUrl: buyer?.avatarUrl || "",
  };
  return (
    <AccountShell active="/account/settings" title="Account Settings">
      <ProfileSettings initial={initial} />
    </AccountShell>
  );
}
