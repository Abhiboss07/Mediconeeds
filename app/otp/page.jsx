// OTP entry is now handled inline within the login/signup flows, so this
// standalone route just redirects into the login flow.
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/login");
}
