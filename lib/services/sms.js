// ============================================================================
// SMS service interface. Default provider = MSG91 (best for India). When
// MSG91_AUTH_KEY is absent, messages are logged to the console (dev). Phone
// numbers are normalised to E.164-ish digits with a default +91 country code.
// ============================================================================
import "server-only";
import { config, isSmsConfigured } from "@/lib/config";

/** Normalise an Indian mobile to MSG91's expected 91XXXXXXXXXX form. */
export function normalizePhone(raw) {
  let d = String(raw || "").replace(/[^\d]/g, "");
  if (d.length === 10) d = "91" + d;          // bare 10-digit → prefix 91
  else if (d.startsWith("0")) d = "91" + d.slice(1);
  return d;
}

/**
 * @param {{ to: string, message: string }} msg
 * @returns {Promise<{ ok: boolean, provider: string, error?: string }>}
 */
export async function sendSms({ to, message }) {
  const phone = normalizePhone(to);

  if (!isSmsConfigured()) {
    console.info(`[sms:dev] → ${phone} | ${message}`);
    return { ok: true, provider: "console" };
  }

  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: config.msg91.authKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: config.msg91.senderId,
        template_id: config.msg91.templateId,
        recipients: [{ mobiles: phone, message }],
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.type === "error") return { ok: false, provider: "msg91", error: data?.message || `HTTP ${res.status}` };
    return { ok: true, provider: "msg91" };
  } catch (err) {
    return { ok: false, provider: "msg91", error: String(err?.message || err) };
  }
}
