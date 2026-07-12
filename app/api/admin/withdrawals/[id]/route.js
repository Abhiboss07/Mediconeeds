// Admin: act on a single withdrawal request — approve, reject or mark paid.
// Marking paid records the payout; because available balance is derived as
// (paid settlements − paid/reserved withdrawals), the seller's wallet balance
// drops automatically the moment this transition happens.
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Withdrawal } from "@/lib/db/models/Withdrawal";
import { shapeWithdrawal } from "@/lib/seller/wallet";

export const dynamic = "force-dynamic";

const Input = z.object({
  action: z.enum(["approve", "reject", "paid"]),
  reason: z.string().trim().max(300).optional(),
  txnRef: z.string().trim().max(60).optional(),
});

// Allowed transitions guard against acting on a request in the wrong state.
const CAN = {
  approve: ["pending"],
  reject: ["pending", "approved"],
  paid: ["approved"],
};

export async function PATCH(req, { params }) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Input.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid action" }, { status: 422 });
  const { action, reason, txnRef } = parsed.data;

  const { id } = await params;
  await dbConnect();
  const w = await Withdrawal.findById(id);
  if (!w) return NextResponse.json({ ok: false, error: "Withdrawal not found" }, { status: 404 });

  if (!CAN[action].includes(w.status)) {
    return NextResponse.json({ ok: false, error: `Cannot ${action} a request that is ${w.status}.` }, { status: 409 });
  }

  const now = new Date();
  w.reviewedBy = g.user?.id || null;
  w.reviewedAt = now;

  if (action === "approve") {
    w.status = "approved";
    w.timeline.push({ status: "approved", at: now, note: "Approved by admin" });
  } else if (action === "reject") {
    w.status = "rejected";
    w.rejectionReason = reason || "";
    w.timeline.push({ status: "rejected", at: now, note: reason ? `Rejected: ${reason}` : "Rejected by admin" });
  } else if (action === "paid") {
    w.status = "paid";
    w.paidAt = now;
    w.txnRef = txnRef || w.txnRef || "";
    w.timeline.push({ status: "paid", at: now, note: txnRef ? `Paid · Ref ${txnRef}` : "Marked paid by admin" });
  }

  await w.save();
  return NextResponse.json({ ok: true, withdrawal: shapeWithdrawal(w.toObject()) });
}
