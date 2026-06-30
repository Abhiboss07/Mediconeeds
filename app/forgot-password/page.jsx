import SiteChrome from "@/components/SiteChrome";
import { AuthCard, Field, Btn } from "@/components/ui";
export const metadata = { title: "Forgot Password" };
export default function Page() {
  return <SiteChrome content={
    <AuthCard title="Forgot Password?" sub="We'll send a reset link to your email"
      footer={<><a href="/login" className="text-[#3056D3] font-semibold">Back to login</a></>}>
      <Field label="Email ID" type="email" placeholder="you@example.com" />
      <Btn as="a" href="/reset-password">Send Reset Link</Btn>
    </AuthCard>} />;
}
