// ============================================================================
// Request an OTP for login / signup / password reset. The response never
// reveals whether an account exists (anti-enumeration) — it always returns ok
// unless input is malformed or the rate limit is hit.
// ============================================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { issueOtp } from "@/lib/auth/otp";
import { normalizePhone } from "@/lib/services/sms";

const Schema = z.object({
  identifier: z.string().trim().min(3),
  channel: z.enum(["email", "sms"]),
  purpose: z.enum(["login", "signup", "reset"]),
});

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter a valid mobile or email." }, { status: 422 });
  const { identifier, channel, purpose } = parsed.data;

  // Shape validation per channel.
  if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 422 });
  if (channel === "sms" && normalizePhone(identifier).length < 12)
    return NextResponse.json({ ok: false, error: "Enter a valid mobile number." }, { status: 422 });

  await dbConnect();
  const query = channel === "email" ? { email: identifier.toLowerCase() } : { phone: { $regex: identifier.replace(/\D/g, "").slice(-10) + "$" } };
  const exists = await User.exists(query);

  // For login/reset a missing account can't receive a code, but we still return
  // ok to avoid leaking which identifiers are registered.
  if ((purpose === "login" || purpose === "reset") && !exists) {
    return NextResponse.json({ ok: true });
  }
  // For signup, an existing account should log in instead — surface gently.
  if (purpose === "signup" && exists) {
    return NextResponse.json({ ok: false, error: "An account already exists. Please log in." }, { status: 409 });
  }

  const res = await issueOtp({ identifier, channel, purpose });
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: res.retryAfter ? 429 : 500 });
  return NextResponse.json({ ok: true });
}
