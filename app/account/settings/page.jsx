import AccountShell from "@/components/AccountShell";
import { Field, Btn } from "@/components/ui";
export const metadata = { title: "Account Settings" };
export default function Page(){
  return <AccountShell active="/account/settings" title="Account Settings">
    <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-6 max-w-[560px] space-y-4">
      <Field label="Full Name" defaultValue="Aanya Sharma"/>
      <Field label="Email" type="email" defaultValue="aanya@example.com"/>
      <Field label="Phone" type="tel" defaultValue="+91 9310032619"/>
      <div className="pt-2"><Btn>Save Changes</Btn></div>
      <hr className="border-[#eef0f5]"/>
      <a href="/reset-password" className="text-[13px] font-semibold text-[#3056D3]">Change Password →</a>
    </div>
  </AccountShell>;
}
