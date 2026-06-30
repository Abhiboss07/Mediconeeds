import SiteChrome from "@/components/SiteChrome";
import { AuthCard, Field, Btn } from "@/components/ui";
export const metadata = { title: "Reset Password" };
export default function Page() {
  return <SiteChrome content={
    <AuthCard title="Set a new password" sub="Choose a strong password for your account"
      footer={<><a href="/login" className="text-[#3056D3] font-semibold">Back to login</a></>}>
      <Field label="New Password" type="password" placeholder="••••••••" />
      <Field label="Confirm Password" type="password" placeholder="••••••••" />
      <Btn as="a" href="/login">Update Password</Btn>
    </AuthCard>} />;
}
