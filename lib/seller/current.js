// ============================================================================
// Resolve the "current seller" for seller-scoped APIs. Uses the signed-in
// seller's profile; in DEMO_MODE (no real session) it falls back to the seeded
// demo seller so the portal stays functional for the client demo.
// ============================================================================
import "server-only";
import { auth } from "@/auth";
import { isDemoMode } from "@/lib/config";
import { dbConnect } from "@/lib/db/mongoose";
import { Seller } from "@/lib/db/models/Seller";

const DEMO_SELLER_EMAIL = "seller@awishclinic.com";

/** The Seller document for the caller, or null if none resolvable. */
export async function currentSeller() {
  await dbConnect();
  const user = (await auth())?.user;
  if (user?.role === "seller" && user.id) {
    const s = await Seller.findOne({ user: user.id });
    if (s) return s;
  }
  if (isDemoMode()) {
    return (await Seller.findOne({ email: DEMO_SELLER_EMAIL })) || (await Seller.findOne({ approval: "approved" }));
  }
  return null;
}
