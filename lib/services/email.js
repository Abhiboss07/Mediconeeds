// ============================================================================
// Email service — SMTP via Nodemailer. Works with any SMTP provider (Gmail,
// Zoho, Hostinger, Brevo, Amazon SES, …) through the SMTP_* env vars. When SMTP
// is not configured, emails are logged to the server console so dev works with
// zero setup. The transporter is memoised across hot-reloads.
// ============================================================================
import "server-only";
import nodemailer from "nodemailer";
import { config, isSmtpConfigured } from "@/lib/config";

const cache = globalThis.__mailer ?? (globalThis.__mailer = { transport: null });

const isProd = process.env.NODE_ENV === "production";

// Placeholder / demo recipients that are not real deliverable mailboxes. System
// notifications (order, product-approval) skip these so seed/demo data doesn't
// generate bounces — e.g. the demo seller seller@awishclinic.com returns
// "554 relay access denied". User-entered addresses (OTP) are never filtered.
const PLACEHOLDER_ADDRESSES = new Set(["seller@awishclinic.com", "buyer@demo.mediconeeds.com"]);
const PLACEHOLDER_DOMAINS = new Set(["example.com", "example.org", "example.net", "test.com", "localhost", "invalid"]);
export function isPlaceholderEmail(email) {
  if (!email || typeof email !== "string") return true;
  const addr = email.toLowerCase().trim();
  if (PLACEHOLDER_ADDRESSES.has(addr)) return true;
  const domain = addr.split("@")[1] || "";
  return PLACEHOLDER_DOMAINS.has(domain) || [".local", ".test", ".invalid", ".example"].some((s) => domain.endsWith(s));
}

function transporter() {
  if (cache.transport) return cache.transport;
  const { host, port, user, pass, secure } = config.smtp;
  cache.transport = nodemailer.createTransport({ host, port, secure, auth: user ? { user, pass } : undefined });
  return cache.transport;
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string }} msg
 * @returns {Promise<{ ok: boolean, id?: string, provider: string, error?: string }>}
 */
export async function sendEmail({ to, subject, html, text }) {
  // TEMP DIAGNOSTIC (remove after Render is diagnosed).
  console.log(`[OTP-6b] sendEmail: isSmtpConfigured=${isSmtpConfigured()} host?=${!!config.smtp.host} port?=${!!config.smtp.port} user?=${!!config.smtp.user} pass?=${!!config.smtp.pass} from?=${!!config.smtp.from}`);
  if (!isSmtpConfigured()) {
    // DEV convenience only: log to console so local dev works with zero setup.
    // In PRODUCTION we NEVER pretend success — the caller must surface a real error.
    if (isProd) {
      console.error("[email] SMTP is not configured — refusing to report a false success in production.");
      return { ok: false, provider: "none", error: "Email delivery is not configured on the server." };
    }
    console.info(`[email:dev] (console fallback — no SMTP) → ${to} | ${subject}\n${text || html}`);
    return { ok: true, provider: "console" };
  }
  try {
    // Phase 9 — prove the connection/credentials before sending.
    try { await transporter().verify(); console.log("[OTP-7] transporter.verify() = OK"); }
    catch (vErr) { console.error("[OTP-7] transporter.verify() FAILED:", vErr?.stack || String(vErr?.message || vErr)); }
    console.log("[OTP-8] calling transporter.sendMail()…");
    const info = await transporter().sendMail({ from: config.smtp.from, to, subject, html, text });
    const accepted = info.accepted || [];
    const rejected = info.rejected || [];
    console.log(`[OTP-9] sendMail finished: messageId=${info.messageId} accepted=${JSON.stringify(accepted)} rejected=${JSON.stringify(rejected)} response="${info.response || ""}"`);
    // A message accepted by SMTP but with rejected/zero recipients is NOT a success.
    if (rejected.length || accepted.length === 0) {
      console.error(`[email] not accepted — accepted=${accepted.length} rejected=${rejected.join(",")} response="${info.response || ""}"`);
      return { ok: false, provider: "smtp", error: `Recipient not accepted: ${rejected.join(", ") || "none"}` };
    }
    console.info(`[email] sent id=${info.messageId} accepted=${accepted.length}`);
    return { ok: true, id: info.messageId, provider: "smtp" };
  } catch (err) {
    console.error("[OTP-ERR] sendMail threw — FULL STACK:", err?.stack || String(err?.message || err));
    return { ok: false, provider: "smtp", error: String(err?.message || err) };
  }
}

import { EmailOutbox } from "@/lib/db/models/EmailOutbox";
import { dbConnect } from "@/lib/db/mongoose";

export async function triggerEmailOutbox() {
  try {
    await dbConnect();
    const pending = await EmailOutbox.find({ status: "pending" }).limit(10);
    for (const email of pending) {
      email.attempts += 1;
      const res = await sendEmail({ to: email.to, subject: email.subject, html: email.html, text: email.body });
      if (res.ok) {
        email.status = "sent";
      } else {
        email.status = "failed";
        email.error = res.error || "Unknown error";
      }
      await email.save();
    }
  } catch (err) {
    console.error("[EMAIL_OUTBOX] Processing error:", err);
  }
}

