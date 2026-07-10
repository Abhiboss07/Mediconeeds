import { redirect } from "next/navigation";

// The supplier flow was superseded by the full seller platform.
// Keep the old URL working by redirecting to the new Become-a-Seller hub.
export default function Page() {
  redirect("/become-seller");
}
