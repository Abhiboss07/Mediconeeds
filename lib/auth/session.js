// ============================================================================
// Server-side session helpers (Node runtime). The second layer of defense:
// protected server components, layouts, and route handlers call these to
// re-verify the caller instead of trusting middleware alone.
// ============================================================================
import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccess, resolveRole, isDemoMode, ROLE_RANK } from "@/lib/auth";

/** Raw Auth.js session (or null). */
export async function getSession() {
  return auth();
}

/** The signed-in user, or null. */
export async function currentUser() {
  const s = await auth();
  return s?.user ?? null;
}

/** Effective role, honouring DEMO_MODE. */
export async function currentRole() {
  const s = await auth();
  return resolveRole(s?.user?.role);
}

/**
 * Guard a server component/page: redirect to /login (or home) unless the caller
 * meets `minRole`. Returns the user when allowed. No-op in DEMO_MODE.
 */
export async function requireRole(minRole, { redirectTo } = {}) {
  if (isDemoMode()) return (await auth())?.user ?? null;
  const user = await currentUser();
  if (!user) redirect(redirectTo || "/login");
  if ((ROLE_RANK[user.role] ?? 0) < (ROLE_RANK[minRole] ?? 99)) redirect("/");
  return user;
}

/** Path-based guard mirroring the middleware map, for use inside pages. */
export async function requirePath(pathname) {
  if (isDemoMode()) return;
  const role = (await currentUser())?.role || "guest";
  if (!canAccess(role, pathname)) redirect(role === "guest" ? "/login" : "/");
}

/**
 * Guard for API route handlers. Returns { ok, status, user }. In DEMO_MODE it
 * allows the request through (user may be null). Never redirects — callers turn
 * a false result into a JSON 401/403.
 */
export async function apiGuard(minRole) {
  if (isDemoMode()) return { ok: true, user: (await auth())?.user ?? null };
  const user = await currentUser();
  if (!user) return { ok: false, status: 401 };
  if ((ROLE_RANK[user.role] ?? 0) < (ROLE_RANK[minRole] ?? 99)) return { ok: false, status: 403 };
  return { ok: true, user };
}
