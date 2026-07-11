import AccountShell from "@/components/AccountShell";
import AddressBook from "@/components/account/AddressBook";
import { currentBuyer } from "@/lib/account/current";

export const metadata = { title: "Saved Addresses" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const buyer = await currentBuyer();
  const addresses = (buyer?.addresses || []).map((a) => ({
    id: String(a._id),
    label: a.label || "Home",
    name: a.name || "",
    line: a.line || "",
    phone: a.phone || "",
    pincode: a.pincode || "",
    isDefault: !!a.isDefault,
  }));
  return (
    <AccountShell active="/account/addresses" title="Saved Addresses">
      <AddressBook initial={addresses} />
    </AccountShell>
  );
}
