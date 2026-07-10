import SiteChrome from "@/components/SiteChrome";
import SignupForm from "@/components/auth/SignupForm";
import { isGoogleEnabled } from "@/lib/config";

export const metadata = { title: "Sign Up" };

export default function Page() {
  return <SiteChrome content={<SignupForm googleEnabled={isGoogleEnabled()} />} />;
}
