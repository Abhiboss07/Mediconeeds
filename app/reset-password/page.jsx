import { Suspense } from "react";
import SiteChrome from "@/components/SiteChrome";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Reset Password" };

export default function Page() {
  return (
    <SiteChrome content={
      <Suspense fallback={<div className="py-16 text-center text-[#6b7280]">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    } />
  );
}
