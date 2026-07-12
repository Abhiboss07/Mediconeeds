// Seller withdrawal requests. GET lists this seller's requests (with timeline);
// POST creates a new "pending" request after validating it against the seller's
// available wallet balance (see lib/seller/wallet.js).
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";
import { dbConnect } from "@/lib/db/mongoose";
import { Withdrawal } from "@/lib/db/models/Withdrawal";
import { buildWallet, shapeWithdrawal } from "@/lib/seller/wallet";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const Input = z.object({
  amount: z.coerce.number().positive("Enter a valid amount"),
  bankName: z.string().trim().max(80).optional(),
  account: z.string().trim().min(4, "Enter your account number").max(40),
  ifsc: z.string().trim().min(4, "Enter a valid IFSC").max(20),
  remark: z.string().trim().max(300).optional(),
});

const ref = () => "WD-" + Math.random().toString(36).slice(2, 8).toUpperCase();

export async function GET() {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  await dbConnect();
  const list = await Withdrawal.find({ seller: seller._id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, withdrawals: list.map(shapeWithdrawal) });
}

export async function POST(req) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Input.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 422 });
  const amount = Math.round(parsed.data.amount);

  const wallet = await buildWallet(seller);
  if (amount > wallet.balances.available) {
    return NextResponse.json(
      { ok: false, error: `Amount exceeds your available balance of ₹${wallet.balances.available.toLocaleString("en-IN")}.` },
      { status: 422 }
    );
  }

  await dbConnect();
  const doc = await Withdrawal.create({
    seller: seller._id,
    sellerName: seller.company || seller.owner || "Seller",
    sellerEmail: seller.email || "",
    amount,
    bank: {
      bankName: parsed.data.bankName || seller.bank?.bankName || "",
      account: parsed.data.account,
      ifsc: (parsed.data.ifsc || "").toUpperCase(),
    },
    remark: parsed.data.remark || "",
    status: "pending",
    reference: ref(),
    timeline: [{ status: "pending", at: new Date(), note: "Withdrawal requested by seller" }],
  });

  return NextResponse.json({ ok: true, withdrawal: shapeWithdrawal(doc.toObject()) }, { status: 201 });
}
