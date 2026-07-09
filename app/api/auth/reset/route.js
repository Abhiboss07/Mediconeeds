// ============================================================================
// Password reset — verifies a "reset" OTP for the identifier, then sets a new
// bcrypt-hashed password. Also used by sellers to set their first password
// after admin approval (same verify-then-set flow).
// ============================================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { verifyOtp } from "@/lib/auth/otp";

const password = z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/);
const Schema = z.object({
  identifier: z.string().trim().min(3),
  channel: z.enum(["email", "sms"]),
  code: z.string().trim().regex(/^\d{6}$/),
  password,
});

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Password must be 8+ chars with upper, lower, and a number." }, { status: 422 });
  const { identifier, channel, code, password: newPassword } = parsed.data;

  const otp = await verifyOtp({ identifier, channel, purpose: "reset", code });
  if (!otp.ok) return NextResponse.json({ ok: false, error: otp.error }, { status: 422 });

  await dbConnect();
  const query = channel === "email"
    ? { email: identifier.toLowerCase().trim() }
    : { phone: { $regex: identifier.replace(/\D/g, "").slice(-10) + "$" } };
  const user = await User.findOne(query);
  if (!user) return NextResponse.json({ ok: false, error: "Account not found." }, { status: 404 });

  await user.setPassword(newPassword);
  if (channel === "email" && !user.emailVerified) user.emailVerified = new Date();
  await user.save();

  return NextResponse.json({ ok: true });
}
