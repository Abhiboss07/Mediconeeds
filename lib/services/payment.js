// ============================================================================
// Payment service — Razorpay via its REST API (no SDK dependency). Order
// creation uses HTTP Basic auth with the key id/secret; verification recomputes
// the HMAC-SHA256 signature. When Razorpay is not configured the caller falls
// back to a simulated "paid" flow so dev/demo works without keys.
// ============================================================================
import "server-only";
import crypto from "node:crypto";
import { config, isRazorpayConfigured } from "@/lib/config";

export { isRazorpayConfigured };

/**
 * Create a Razorpay order. Amount is in rupees; Razorpay wants paise.
 * @returns {Promise<{ ok: boolean, id?: string, amount?: number, error?: string }>}
 */
export async function createRazorpayOrder({ amount, receipt }) {
  const { keyId, keySecret } = config.razorpay;
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  try {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Math.round(amount * 100), currency: "INR", receipt, payment_capture: 1 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error?.description || `HTTP ${res.status}` };
    return { ok: true, id: data.id, amount: data.amount };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

/** Verify the checkout signature: HMAC_SHA256(order_id|payment_id, secret). */
export function verifyRazorpaySignature({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature) return false;
  const expected = crypto.createHmac("sha256", config.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** The publishable key id for the client widget. */
export const razorpayKeyId = () => config.razorpay.keyId;
