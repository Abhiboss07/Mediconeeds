// ============================================================================
// Wallet domain logic — the single source of truth for a seller's balances,
// derived from real Settlement + Withdrawal documents (no mock data).
//
// Balance model (all money in rupees):
//   creditedTotal  = Σ net of settlements with status "paid"      (earned)
//   withdrawnPaid  = Σ amount of withdrawals with status "paid"   (paid out)
//   reserved       = Σ amount of withdrawals pending/approved     (in-flight)
//   available      = creditedTotal − withdrawnPaid − reserved     (withdrawable)
// A seller can never request more than `available`, which also means an
// approved-but-unpaid request already reduces what can be requested again.
// ============================================================================
import "server-only";
import { dbConnect } from "@/lib/db/mongoose";
import { Settlement } from "@/lib/db/models/Settlement";
import { Withdrawal } from "@/lib/db/models/Withdrawal";

const money = (n) => Math.round(Number(n) || 0);

export function periodLabel(s) {
  if (!s?.periodStart || !s?.periodEnd) return "";
  const fmt = (d) => new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  const yr = new Date(s.periodEnd).getFullYear();
  return `${fmt(s.periodStart)} – ${fmt(s.periodEnd)} ${yr}`;
}

export function shapeSettlement(s) {
  return {
    id: String(s._id),
    settlementNo: s.settlementNo,
    invoiceNo: s.invoiceNo,
    date: s.settledOn || s.periodEnd,
    periodLabel: periodLabel(s),
    orderCount: s.orderCount || 0,
    gross: money(s.gross),
    commissionRate: s.commissionRate || 8,
    commission: money(s.commission),
    gstRate: s.gstRate || 18,
    gstOnCommission: money(s.gstOnCommission),
    net: money(s.net),
    status: s.status,
    txnRef: s.txnRef || "",
  };
}

export function shapeWithdrawal(w) {
  return {
    id: String(w._id),
    reference: w.reference,
    amount: money(w.amount),
    bank: { bankName: w.bank?.bankName || "", account: w.bank?.account || "", ifsc: w.bank?.ifsc || "" },
    remark: w.remark || "",
    status: w.status,
    rejectionReason: w.rejectionReason || "",
    txnRef: w.txnRef || "",
    createdAt: w.createdAt,
    paidAt: w.paidAt,
    timeline: (w.timeline || []).map((t) => ({ status: t.status, at: t.at, note: t.note || "" })),
  };
}

/** Compute the full wallet payload for a seller document. */
export async function buildWallet(seller) {
  await dbConnect();
  const sid = seller._id;
  const [settlements, withdrawals] = await Promise.all([
    Settlement.find({ seller: sid }).sort({ periodEnd: -1 }).lean(),
    Withdrawal.find({ seller: sid }).sort({ createdAt: -1 }).lean(),
  ]);

  const creditedTotal = settlements.filter((s) => s.status === "paid").reduce((a, s) => a + (s.net || 0), 0);
  const upcoming = settlements.filter((s) => s.status === "upcoming").reduce((a, s) => a + (s.net || 0), 0);
  const processing = settlements.filter((s) => s.status === "processing").reduce((a, s) => a + (s.net || 0), 0);
  const withdrawnPaid = withdrawals.filter((w) => w.status === "paid").reduce((a, w) => a + (w.amount || 0), 0);
  const reserved = withdrawals.filter((w) => w.status === "pending" || w.status === "approved").reduce((a, w) => a + (w.amount || 0), 0);
  const available = Math.max(0, creditedTotal - withdrawnPaid - reserved);

  const rate = settlements[0]?.commissionRate || 8;

  return {
    balances: {
      available: money(available),
      upcoming: money(upcoming),
      processing: money(processing),
      paidOut: money(withdrawnPaid),
      credited: money(creditedTotal),
      reserved: money(reserved),
      commissionRate: rate,
    },
    bank: {
      bankName: seller.bank?.bankName || "",
      account: seller.bank?.account || "",
      ifsc: seller.bank?.ifsc || "",
    },
    settlements: settlements.map(shapeSettlement),
    withdrawals: withdrawals.map(shapeWithdrawal),
  };
}
