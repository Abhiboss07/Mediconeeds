// Admin: decide a seller application / manage a seller's status.
// approve → seller becomes "approved" and is emailed a set-password link so
// they can activate their account and reach the dashboard.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Seller } from "@/lib/db/models/Seller";
import { sendEmail } from "@/lib/services/email";
import { notify } from "@/lib/services/notify";
import { config } from "@/lib/config";

const DECISIONS = { approve: "approved", reject: "rejected", suspend: "suspended", reinstate: "approved" };

async function sendApprovalEmail(seller) {
  const link = `${config.authUrl}/forgot-password`;
  await sendEmail({
    to: seller.email,
    subject: "Your Mediconeeds seller account is approved 🎉",
    text: `Congratulations! ${seller.company} has been approved as a Mediconeeds seller. Set your password to access your dashboard: ${link}`,
    html: `<p>Congratulations! <b>${seller.company}</b> has been approved as a Mediconeeds seller.</p>
           <p><a href="${link}">Set your password</a> to activate your account and open your seller dashboard.</p>`,
  });
}

export async function POST(req, { params }) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });

  const { id } = await params;
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }

  const approval = DECISIONS[body?.decision];
  if (!approval) return NextResponse.json({ ok: false, error: "Unknown decision" }, { status: 400 });

  await dbConnect();
  const seller = await Seller.findById(id);
  if (!seller) return NextResponse.json({ ok: false, error: "Seller not found" }, { status: 404 });

  const wasPending = seller.approval === "pending";
  seller.approval = approval;
  seller.reviewedAt = new Date();
  if (g.user?.id) seller.reviewedBy = g.user.id;
  if (body?.reason) seller.rejectionReason = String(body.reason);
  await seller.save();

  if (body.decision === "approve" && wasPending) {
    sendApprovalEmail(seller).catch(() => {}); // best-effort; don't fail the decision
  }
  // In-app notification for the seller's account (email handled above for approve).
  if (seller.user) {
    const approved = approval === "approved";
    await notify({
      userId: seller.user, type: approved ? "approval" : "rejected", link: "/seller/dashboard",
      title: approved ? "Seller account approved" : `Seller account ${approval}`,
      body: approved ? "Your account is approved — set your password to access your dashboard." : (seller.rejectionReason || `Your application status is now ${approval}.`),
    });
  }
  return NextResponse.json({ ok: true, approval });
}
