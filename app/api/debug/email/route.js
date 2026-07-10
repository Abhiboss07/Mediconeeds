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

  // Step 5/6: force a real send and capture the raw provider response.
  const send = await sendEmail({
    to: to || process.env.ADMIN_EMAIL || process.env.SMTP_USER,
    subject: "Mediconeeds SMTP diagnostic ✔",
    text: "This is an automated SMTP pipeline test. If you received it, outgoing email works.",
    html: "<p>This is an automated <b>SMTP pipeline test</b>. If you received it, outgoing email works.</p>",
  });
  result.send = send;
  result.diagnosis = send.ok
    ? `Email accepted by the provider (id=${send.id}). It should appear in your SMTP dashboard and inbox.`
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
