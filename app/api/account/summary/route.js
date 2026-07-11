// ============================================================================
// Account dashboard summary — ALL data is scoped to the current buyer. There is
// no mock/demo fallback here: a brand-new account returns zeros and empty lists.
// ============================================================================
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { currentBuyer } from "@/lib/account/current";
import { buildBuyerSummary, EMPTY_SUMMARY } from "@/lib/account/summary";

export async function GET() {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });

  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: true, ...EMPTY_SUMMARY });

  const summary = await buildBuyerSummary(buyer);
  return NextResponse.json({ ok: true, ...summary });
}
