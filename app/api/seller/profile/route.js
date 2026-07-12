// Lightweight identity for the seller portal header — the real logged-in
// seller's company/status/initials, so SellerShell never shows the seeded demo
// name. Never cached.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const initials = (name) =>
  (name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "S";

export async function GET() {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  const company = seller.company || seller.owner || "Seller";
  return NextResponse.json({
    ok: true,
    seller: {
      company,
      owner: seller.owner || "",
      email: seller.email || "",
      status: seller.approval || "pending",
      avatar: initials(company),
    },
  });
}
