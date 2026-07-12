// ============================================================================
// Minimal in-memory sliding-window rate limiter for the bulk endpoints. Best
// effort (per-instance) — enough to stop a single seller hammering validate/
// upload. Swap for a Redis/Upstash limiter when running multi-instance.
// ============================================================================
const buckets = new Map();

/** @returns {{ok:boolean, retryAfter?:number}} */
export function rateLimit(key, { max = 30, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true };
}
