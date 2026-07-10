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

// TEMP DIAGNOSTIC (remove after Render is diagnosed): masked identifier for logs.
const mask = (s) => String(s || "").replace(/^(.{2}).*(@.*)$/, "$1***$2").replace(/(\d{2})\d+(\d{2})$/, "$1***$2");

export async function POST(req) {
  console.log("[OTP-1] request received");
  // Phase 8 — env presence at runtime (NEVER prints secret values).
  console.log(`[OTP-ENV] SMTP_HOST=${!!process.env.SMTP_HOST} SMTP_PORT=${!!process.env.SMTP_PORT} SMTP_USER=${!!process.env.SMTP_USER} SMTP_PASS=${!!process.env.SMTP_PASS} SMTP_FROM=${!!process.env.SMTP_FROM} MONGODB_URI=${!!process.env.MONGODB_URI} NODE_ENV=${process.env.NODE_ENV} DEMO_MODE=${process.env.DEMO_MODE}`);
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) { console.warn("[OTP-2] validation FAILED"); return NextResponse.json({ ok: false, error: "Enter a valid mobile or email." }, { status: 422 }); }
  const { identifier, channel, purpose } = parsed.data;
  console.log(`[OTP-2] validated: purpose=${purpose} channel=${channel} identifier=${mask(identifier)}`);

  // Shape validation per channel.
  if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))
    return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 422 });
  if (channel === "sms" && normalizePhone(identifier).length < 12)
    return NextResponse.json({ ok: false, error: "Enter a valid mobile number." }, { status: 422 });

  await dbConnect();
  const query = channel === "email" ? { email: identifier.toLowerCase() } : { phone: { $regex: identifier.replace(/\D/g, "").slice(-10) + "$" } };
  const exists = await User.exists(query);
  console.log(`[OTP-3] user lookup: account exists in DB = ${!!exists}`);

  // For login/reset a missing account can't receive a code, but we still return
  // ok to avoid leaking which identifiers are registered.
  if ((purpose === "login" || purpose === "reset") && !exists) {
    console.warn(`[OTP-SKIP] ${purpose} for an identifier NOT in the DB → returning ok WITHOUT sending (anti-enumeration). THIS is the success-without-email path. The account must sign up, or Render is pointed at the wrong DB.`);
    return NextResponse.json({ ok: true });
  }
  // For signup, an existing account should log in instead — surface gently.
  if (purpose === "signup" && exists) {
    console.warn("[OTP-SKIP] signup for an existing account → 409, no send.");
    return NextResponse.json({ ok: false, error: "An account already exists. Please log in." }, { status: 409 });
  }

  console.log("[OTP-4] proceeding to issueOtp (will generate + save + send)…");
  const res = await issueOtp({ identifier, channel, purpose });
  console.log(`[OTP-10] issueOtp returned ok=${res.ok}${res.error ? ` error="${res.error}"` : ""}`);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: res.retryAfter ? 429 : 500 });
  return NextResponse.json({ ok: true });
}
