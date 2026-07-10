// ============================================================================
// Email pipeline diagnostics (admin-only). Force-tests SMTP outside the OTP
// flow: reports env presence (never values), runs transporter.verify(), and
// attempts a real send — returning the raw provider result. This pinpoints the
// exact breakpoint in ANY environment (local or Render).
//   POST /api/debug/email  { "to": "you@example.com" }
// ============================================================================
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { verifyTransport, sendEmail } from "@/lib/services/email";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const status = (v) => (v == null || v === "" ? "✗ MISSING/EMPTY" : "✓ present");

async function diagnose(to) {
  const env = {
    NODE_ENV: process.env.NODE_ENV || "(unset)",
    SMTP_HOST: status(process.env.SMTP_HOST),
    SMTP_PORT: status(process.env.SMTP_PORT),
    SMTP_USER: status(process.env.SMTP_USER),
    SMTP_PASS: status(process.env.SMTP_PASS),
    SMTP_FROM: status(process.env.SMTP_FROM),
    SMTP_SECURE: process.env.SMTP_SECURE ?? "(unset)",
    MONGODB_URI: status(process.env.MONGODB_URI),
    AUTH_SECRET: status(process.env.AUTH_SECRET),
  };
  const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  // Step 4: verify connection/credentials BEFORE sending.
  const verify = await verifyTransport();
  const result = { env, smtpConfigured: configured, verify };

  if (!configured) {
    result.diagnosis = "SMTP_HOST and/or SMTP_USER are not set — the app returns before ever contacting the SMTP server, so no attempt reaches the provider. Set the SMTP_* env vars in this environment (Render) and redeploy.";
    return result;
  }
  if (!verify.ok) {
    result.diagnosis = `SMTP is configured but the connection/credentials failed (${verify.error}). Fix the credentials (Gmail needs a 16-char App Password) or host/port/secure.`;
    return result;
  }

  // Surface the effective From + a Gmail sender-rewrite warning. Gmail SMTP
  // overrides From to the authenticated account unless the address is a verified
  // "Send mail as" alias — a mismatch is a common "accepted but looks off" cause.
  const fromHeader = config.smtp.from;
  const isGmail = /smtp\.gmail\.com/i.test(process.env.SMTP_HOST || "");
  const fromMatchesUser = fromHeader.toLowerCase().includes(String(process.env.SMTP_USER || "").toLowerCase());
  result.sender = { from: fromHeader, smtpUser: `${String(process.env.SMTP_USER||"").split("@")[0].slice(0,2)}***@${String(process.env.SMTP_USER||"").split("@")[1]||""}`, fromMatchesAuthUser: fromMatchesUser };
  if (isGmail && !fromMatchesUser) {
    result.warnings = [
      "Gmail SMTP will REWRITE the From header to your authenticated Gmail address because the configured From is not a verified 'Send mail as' alias. This still delivers, but set SMTP_FROM to your Gmail address (or verify the alias in Gmail settings) to avoid spoof-looking mail landing in spam.",
    ];
  }

  // Step 5/6/8: force a MINIMAL plain send and capture the raw provider response.
  const send = await sendEmail({
    to: to || process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject: "SMTP Test",
    text: "Hello World — Mediconeeds SMTP pipeline test. If you received this, outgoing email works.",
    html: "<p>Hello World — <b>Mediconeeds SMTP pipeline test</b>. If you received this, outgoing email works.</p>",
  });
  result.send = send; // includes raw { accepted, rejected, response, envelope, messageId }
  result.diagnosis = send.ok
    ? `Provider accepted for delivery (accepted=${send.raw?.accepted?.length}, response="${send.raw?.response}"). If it still doesn't arrive, check Spam/Promotions and the provider's Sent/Activity log — the handoff succeeded.`
    : `Send failed: ${send.error}`;
  return result;
}

export async function POST(req) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false, error: "Admin only" }, { status: g.status });
  let to = "";
  try { to = (await req.json())?.to || ""; } catch {}
  const result = await diagnose(to);
  return NextResponse.json({ ok: true, ...result });
}

export async function GET() {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false, error: "Admin only" }, { status: g.status });
  const result = await diagnose("");
  return NextResponse.json({ ok: true, ...result });
}
