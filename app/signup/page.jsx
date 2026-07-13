import SiteChrome from "@/components/SiteChrome";
import SignupForm from "@/components/auth/SignupForm";
import { isGoogleEnabled } from "@/lib/config";

export const metadata = { title: "Sign Up" };

export default async function Page({ searchParams }) {
  const sp = (await searchParams) || {};
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "";
  return <SiteChrome content={<SignupForm googleEnabled={isGoogleEnabled()} callbackUrl={callbackUrl} />} />;
}
