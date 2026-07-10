// ============================================================================
// Email service — SMTP via Nodemailer. Works with any SMTP provider (Gmail,
// Zoho, Hostinger, Brevo, Amazon SES, …) through the SMTP_* env vars. When SMTP
// is not configured, emails are logged to the server console so dev works with
// zero setup. The transporter is memoised across hot-reloads.
// ============================================================================
import "server-only";
import net from "node:net";
import dns from "node:dns/promises";
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

// Build the SMTP transport, forcing an IPv4 connection.
//
// Nodemailer dials the AAAA (IPv6) record first. Many hosts (e.g. Render) have no
// IPv6 egress route, so that first dial fails with `connect ENETUNREACH` before
// the mail ever reaches the provider — and nothing shows in the SMTP dashboard.
// `family:4`/`dns.setDefaultResultOrder` don't help because Nodemailer runs its
// own resolver. So we resolve the A (IPv4) record ourselves and connect straight
// to that IP, keeping `tls.servername` on the hostname so SNI + certificate
// validation still target the real host.
async function transporter() {
  if (cache.transport) return cache.transport;
  const { host, port, user, pass, secure } = config.smtp;

  let connectHost = host;
  let tls;
  try {
    if (host && !net.isIP(host)) {
      const [ipv4] = await dns.resolve4(host);
      if (ipv4) { connectHost = ipv4; tls = { servername: host }; }
    }
  } catch (err) {
    console.warn(`[email] IPv4 resolve failed for ${host} — falling back to hostname:`, String(err?.message || err));
  }
  console.info(`[email] SMTP transport → ${connectHost}:${port} (IPv4${connectHost !== host ? `, SNI ${host}` : ""}) secure=${secure}`);

  cache.transport = nodemailer.createTransport({
    host: connectHost,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
    ...(tls ? { tls } : {}),
    family: 4, // belt-and-suspenders for the hostname-fallback path
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
  return cache.transport;
}

// Drop the cached transport so the next send re-resolves the IPv4 (handles the
// pinned Gmail IP rotating / going stale). Called after a network-level failure.
function resetTransport() { cache.transport = null; }

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
    const tx = await transporter();
    const info = await tx.sendMail({ from: config.smtp.from, to, subject, html, text });
    const accepted = info.accepted || [];
    const rejected = info.rejected || [];
    // A message accepted by SMTP but with rejected/zero recipients is NOT a success.
    if (rejected.length || accepted.length === 0) {
      console.error(`[email] not accepted — accepted=${accepted.length} rejected=${rejected.join(",")} response="${info.response || ""}"`);
      return { ok: false, provider: "smtp", error: `Recipient not accepted: ${rejected.join(", ") || "none"}` };
    }
    console.info(`[email] sent id=${info.messageId} accepted=${accepted.length}`);
    return { ok: true, id: info.messageId, provider: "smtp" };
  } catch (err) {
    // On a network-level failure, drop the cached transport so the pinned IPv4 is
    // re-resolved on the next attempt (handles Gmail IP rotation / a dead route).
    if (["ENETUNREACH", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN", "ECONNRESET", "EHOSTUNREACH"].includes(err?.code)) resetTransport();
    console.error(`[email] send failed (${err?.code || "?"}):`, String(err?.message || err));
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

