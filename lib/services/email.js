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

function transporter() {
  if (cache.transport) return cache.transport;
  const { host, port, user, pass, secure } = config.smtp;
  cache.transport = nodemailer.createTransport({ host, port, secure, auth: user ? { user, pass } : undefined });
  return cache.transport;
}

/** Verify the SMTP connection/credentials. Used by diagnostics + first send. */
export async function verifyTransport() {
  if (!isSmtpConfigured()) return { ok: false, error: "SMTP is not configured (SMTP_HOST/SMTP_USER missing)." };
  try { await transporter().verify(); return { ok: true }; }
  catch (err) { return { ok: false, error: String(err?.message || err) }; }
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string }} msg
 * @returns {Promise<{ ok: boolean, id?: string, provider: string, error?: string }>}
 */
export async function sendEmail({ to, subject, html, text }) {
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
    const info = await transporter().sendMail({ from: config.smtp.from, to, subject, html, text });
    // Raw provider response — the source of truth for delivery diagnosis.
    const raw = {
      accepted: info.accepted || [],
      rejected: info.rejected || [],
      response: info.response || "",
      envelope: info.envelope || {},
      messageId: info.messageId || "",
    };
    // A message accepted by SMTP but with rejected recipients is NOT a success.
    if (raw.rejected.length || raw.accepted.length === 0) {
      console.error(`[email] not accepted — accepted=${raw.accepted.length} rejected=${raw.rejected.join(",")} response="${raw.response}"`);
      return { ok: false, provider: "smtp", error: `Not accepted (rejected: ${raw.rejected.join(", ") || "none"}; response: ${raw.response})`, raw };
    }
    console.info(`[email] sent id=${raw.messageId} accepted=${raw.accepted.length} response="${raw.response}"`);
    return { ok: true, id: raw.messageId, provider: "smtp", raw };
  } catch (err) {
    console.error("[email] send failed:", String(err?.message || err));
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

