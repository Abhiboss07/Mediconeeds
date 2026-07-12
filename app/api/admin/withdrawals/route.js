// Admin: list all seller withdrawal requests across the marketplace.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Withdrawal } from "@/lib/db/models/Withdrawal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const shape = (w) => ({
  id: String(w._id),
  reference: w.reference,
  sellerName: w.sellerName || "Seller",
  sellerEmail: w.sellerEmail || "",
  amount: Math.round(w.amount || 0),
  bank: { bankName: w.bank?.bankName || "", account: w.bank?.account || "", ifsc: w.bank?.ifsc || "" },
  remark: w.remark || "",
  status: w.status,
  rejectionReason: w.rejectionReason || "",
  txnRef: w.txnRef || "",
  createdAt: w.createdAt,
  paidAt: w.paidAt,
});

export async function GET() {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });

  await dbConnect();
  const list = await Withdrawal.find({}).sort({ createdAt: -1 }).lean();
  const byStatus = { pending: [], approved: [], paid: [], rejected: [] };
  for (const w of list) (byStatus[w.status] || (byStatus[w.status] = [])).push(shape(w));
  return NextResponse.json({ ok: true, withdrawals: list.map(shape), byStatus });
}
