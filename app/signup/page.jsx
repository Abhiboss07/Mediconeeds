import SiteChrome from "@/components/SiteChrome";
import { AuthCard, Field, Btn } from "@/components/ui";
export const metadata = { title: "Sign Up" };
export default function Page() {
  return <SiteChrome content={
    <AuthCard title="Create your account" sub="Join Mediconeeds for dermatologist-formulated skincare"
      footer={<>Already have an account? <a href="/login" className="text-[#3056D3] font-semibold">Log in</a></>}>
      <Field label="Full Name" placeholder="Your name" />
      <Field label="Mobile Number" type="tel" placeholder="+91 ..." />
      <Field label="Email ID" type="email" placeholder="you@example.com" />
      <Btn as="a" href="/otp">Create Account</Btn>
      <div className="flex items-center gap-3 text-[12px] text-[#9ca3af]"><span className="h-px bg-[#e5e7eb] flex-1"/>OR<span className="h-px bg-[#e5e7eb] flex-1"/></div>
      <Btn variant="outline">Continue with Google</Btn>
    </AuthCard>} />;
}
