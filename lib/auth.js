// ============================================================================
// RBAC core — EDGE-SAFE pure functions (no DB, no session imports). Shared by
// middleware, server components, and route handlers. Defines roles, the
// route→role access map, and the demo-mode resolver used during rollout.
// ============================================================================

/** @typedef {"guest"|"buyer"|"seller"|"admin"|"superadmin"} Role */

export const ROLES = ["guest", "buyer", "seller", "admin", "superadmin"];

// Higher rank inherits access of lower ranks.
export const ROLE_RANK = { guest: 0, buyer: 1, seller: 2, admin: 3, superadmin: 4 };

// Route prefix → minimum role required. Most-specific prefix wins.
export const ROUTE_GUARDS = [
  { prefix: "/seller/register", role: "guest" }, // application is public
  { prefix: "/seller", role: "seller" },
  { prefix: "/account", role: "buyer" },
  { prefix: "/checkout", role: "buyer" },
  { prefix: "/order-success", role: "buyer" },
  { prefix: "/admin", role: "admin" },
  { prefix: "/api/seller", role: "seller" },
  { prefix: "/api/admin", role: "admin" },
];

/** Minimum role for a path, or null if public. */
export function requiredRole(pathname) {
  const match = ROUTE_GUARDS
    .filter((g) => pathname === g.prefix || pathname.startsWith(g.prefix + "/"))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
  return match ? match.role : null;
}

/**
 * Does `role` satisfy the requirement `need`?
 *
 * POLICY: buyer surfaces (checkout, account, order-success and their APIs) are
 * for buyers ONLY. Sellers and admins run their own portals and must not shop or
 * hold buyer account data through the buyer flow — so "buyer" is enforced as an
 * EXACT role, not "rank ≥ buyer". Every other requirement stays hierarchical
 * (a higher role inherits lower-role access). This is the single source of truth
 * used by the middleware, page guards, and API guards.
 */
export function meetsRole(role, need) {
  if (!need || need === "guest") return true;
  if (need === "buyer") return role === "buyer";
  return (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[need] ?? 99);
}

/** Can a role reach a path? (guest-required routes are public.) */
export function canAccess(role, pathname) {
  return meetsRole(role, requiredRole(pathname));
}

// --- Demo rollout -----------------------------------------------------------
// While DEMO_MODE is on, protected routes stay open and every request is
// treated as DEMO_ROLE so the approved client demo keeps working before real
// accounts exist. SECURE BY DEFAULT: demo mode requires an EXPLICIT opt-in
// (DEMO_MODE=true), so a fresh deploy with the var unset enforces real auth and
// never auto-authenticates a visitor. Must mirror lib/config.js's `bool()`.
export function isDemoMode() {
  const v = process.env.DEMO_MODE;
  return v != null && v !== "false" && v !== "0" && v !== "";
}

/**
 * Effective role for a request given the real session role (or null/guest).
 * In demo mode this returns DEMO_ROLE regardless of session.
 */
export function resolveRole(sessionRole) {
  if (isDemoMode()) return process.env.DEMO_ROLE || "seller";
  return sessionRole || "guest";
}
