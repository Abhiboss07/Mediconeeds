import SiteChrome from "@/components/SiteChrome";
import { AuthCard, Field, Btn } from "@/components/ui";
export const metadata = { title: "Log In" };
export default function Page() {
  return <SiteChrome content={
    <AuthCard title="Log In or Sign Up" sub="Welcome back to Mediconeeds"
      footer={<>New here? <a href="/signup" className="text-[#3056D3] font-semibold">Create an account</a></>}>
      <Field label="Mobile or Email ID" placeholder="eg. 9847372621 or you@example.com" />
      <Btn as="a" href="/otp">Continue</Btn>
      <div className="flex items-center gap-3 text-[12px] text-[#9ca3af]"><span className="h-px bg-[#e5e7eb] flex-1"/>OR<span className="h-px bg-[#e5e7eb] flex-1"/></div>
      <Btn variant="outline">Continue with Google</Btn>
      <p className="text-[11px] text-[#9ca3af] text-center">By continuing you agree to Mediconeeds's <a href="/policy/terms" className="underline">Terms</a> & <a href="/policy/privacy" className="underline">Privacy Policy</a>.</p>
    </AuthCard>} />;
}
