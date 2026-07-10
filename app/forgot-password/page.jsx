import SiteChrome from "@/components/SiteChrome";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot Password" };

export default function Page() {
  return <SiteChrome content={<ForgotPasswordForm />} />;
}
