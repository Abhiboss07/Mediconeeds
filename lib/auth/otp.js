// ============================================================================
// OTP issue/verify logic. Generates 6-digit codes, stores only their hash,
// rate-limits per identifier, and delivers via the email/SMS service. Verify is
// constant-effort (hash compare) with an attempt cap to resist brute force.
// ============================================================================
import "server-only";
import crypto from "crypto";
import { dbConnect } from "@/lib/db/mongoose";
import { Otp } from "@/lib/db/models/Otp";
import { sendEmail } from "@/lib/services/email";
import { sendSms, normalizePhone } from "@/lib/services/sms";
import { config } from "@/lib/config";

const TTL = config.otp.ttlSeconds;
const MAX_PER_HOUR = config.otp.maxPerHour;
const MAX_ATTEMPTS = 5;

const hash = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");
const normalize = (identifier, channel) =>
  channel === "email" ? String(identifier).toLowerCase().trim() : normalizePhone(identifier);

/**
 * Issue an OTP and deliver it. Rate-limited per identifier per hour.
 * @returns {Promise<{ ok: boolean, error?: string, retryAfter?: number }>}
 */
export async function issueOtp({ identifier, channel, purpose }) {
  await dbConnect();
  const id = normalize(identifier, channel);

  // Rate limit: count issued codes in the last hour.
  const since = new Date(Date.now() - 3600 * 1000);
  const recent = await Otp.countDocuments({ identifier: id, purpose, createdAt: { $gte: since } });
  if (recent >= MAX_PER_HOUR) return { ok: false, error: "Too many requests. Try again later.", retryAfter: 3600 };

  // Invalidate any previous unconsumed codes for this identifier+purpose.
  await Otp.updateMany({ identifier: id, purpose, consumedAt: null }, { $set: { consumedAt: new Date() } });

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await Otp.create({ identifier: id, channel, purpose, codeHash: hash(code), expiresAt: new Date(Date.now() + TTL * 1000) });

  const mins = Math.round(TTL / 60);
  const delivery =
    channel === "email"
      ? sendEmail({
          to: id,
          subject: `Your Mediconeeds verification code: ${code}`,
          text: `Your verification code is ${code}. It expires in ${mins} minutes.`,
          html: `<p>Your Mediconeeds verification code is <b style="font-size:20px">${code}</b>.</p><p>It expires in ${mins} minutes. If you didn't request this, ignore this email.</p>`,
        })
      : sendSms({ to: id, message: `${code} is your Mediconeeds OTP. Valid for ${mins} min.` });

  const res = await delivery;
  if (!res.ok) return { ok: false, error: "Could not send the code. Please try again." };
  return { ok: true };
}

/**
 * Verify a submitted code. Consumes it on success.
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function verifyOtp({ identifier, channel, purpose, code }) {
  await dbConnect();
  const id = normalize(identifier, channel);

  const rec = await Otp.findOne({ identifier: id, purpose, consumedAt: null }).sort({ createdAt: -1 });
  if (!rec) return { ok: false, error: "No active code. Request a new one." };
  if (rec.expiresAt < new Date()) return { ok: false, error: "Code expired. Request a new one." };
  if (rec.attempts >= MAX_ATTEMPTS) {
    await Otp.updateOne({ _id: rec._id }, { $set: { consumedAt: new Date() } });
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  const ok = crypto.timingSafeEqual(Buffer.from(rec.codeHash), Buffer.from(hash(code)));
  if (!ok) {
    await Otp.updateOne({ _id: rec._id }, { $inc: { attempts: 1 } });
    return { ok: false, error: "Incorrect code." };
  }

  await Otp.updateOne({ _id: rec._id }, { $set: { consumedAt: new Date() } });
  return { ok: true };
}
