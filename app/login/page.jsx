import SiteChrome from "@/components/SiteChrome";
import LoginForm from "@/components/auth/LoginForm";
import { isGoogleEnabled } from "@/lib/config";

export const metadata = { title: "Log In" };

export default async function Page({ searchParams }) {
  const sp = (await searchParams) || {};
  const googleEnabled = isGoogleEnabled();
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "";
  return <SiteChrome content={<LoginForm googleEnabled={googleEnabled} callbackUrl={callbackUrl} />} />;
}
