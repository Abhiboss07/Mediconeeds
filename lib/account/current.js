// ============================================================================
// Resolve the "current buyer" for account-scoped APIs. Uses the signed-in user;
// in DEMO_MODE (no real session) it falls back to the seeded demo buyer so the
// account portal shows real data for the client demo.
// ============================================================================
import "server-only";
import { auth } from "@/auth";
import { isDemoMode } from "@/lib/config";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";

const DEMO_BUYER_EMAIL = "buyer@demo.mediconeeds.com";

/** The User document for the current buyer, or null. */
export async function currentBuyer() {
  await dbConnect();
  const sessionUser = (await auth())?.user;
  if (sessionUser?.id) {
    const u = await User.findById(sessionUser.id);
    if (u) return u;
  }
  if (isDemoMode()) return User.findOne({ email: DEMO_BUYER_EMAIL });
  return null;
}
