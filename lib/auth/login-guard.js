// ============================================================================
// Brute-force guard for password login. Tracks failed attempts per ACCOUNT and
// per IP over a sliding window; once either crosses the threshold the login is
// locked (HTTP 429) until the window clears. A successful login resets both
// counters. In-memory (per instance) — swap for Redis when running multi-node.
// ============================================================================
const MAX_FAILS = Number(process.env.LOGIN_MAX_FAILS) || 8; // per account OR per IP
const WINDOW_MS = (Number(process.env.LOGIN_WINDOW_MIN) || 15) * 60_000; // 15 min

const store = new Map(); // key -> number[] (failure timestamps)

function recent(key) {
  const now = Date.now();
  const arr = (store.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length) store.set(key, arr); else store.delete(key);
  return arr;
}
const keys = (ip, email) => [ip && `ip:${ip}`, email && `acct:${email}`].filter(Boolean);

/** @returns {{locked:boolean, retryAfter?:number}} */
export function checkLogin(ip, email) {
  const now = Date.now();
  for (const k of keys(ip, email)) {
    const arr = recent(k);
    if (arr.length >= MAX_FAILS) return { locked: true, retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - arr[0])) / 1000)) };
  }
  return { locked: false };
}

/** Record one failed attempt against both the IP and the account. */
export function recordLoginFailure(ip, email) {
  const now = Date.now();
  for (const k of keys(ip, email)) { const arr = recent(k); arr.push(now); store.set(k, arr); }
}

/** Clear counters after a successful login. */
export function resetLogin(ip, email) {
  for (const k of keys(ip, email)) store.delete(k);
}

export const LOGIN_LIMITS = { MAX_FAILS, WINDOW_MS };
