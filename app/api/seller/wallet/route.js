// Live seller wallet — balances, settlement history and withdrawal timeline,
// all computed from real Settlement + Withdrawal documents. Never cached.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";
import { buildWallet } from "@/lib/seller/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  const wallet = await buildWallet(seller);
  return NextResponse.json({
    ok: true,
    seller: { company: seller.company, owner: seller.owner, gst: seller.gst || "", email: seller.email || "" },
    ...wallet,
  });
}
