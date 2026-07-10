// ============================================================================
// Route protection (first line of defense). Runs on the edge, decodes the JWT
// session via Auth.js, and enforces the RBAC map from lib/auth.js. Server
// components & route handlers re-check independently (defense-in-depth) — this
// middleware is a fast reject, not the sole gate.
//
// While DEMO_MODE is on, every route is allowed so the client demo stays open.
// ============================================================================
import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import { canAccess, requiredRole, isDemoMode } from "./lib/auth";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname, search } = req.nextUrl;

  // Rollout escape hatch: keep everything browsable without login.
  if (isDemoMode()) return NextResponse.next();

  const need = requiredRole(pathname);
  if (!need || need === "guest") return NextResponse.next();

  const role = req.auth?.user?.role || "guest";
  const isApi = pathname.startsWith("/api");

  // Not signed in → API gets JSON 401; pages redirect to login with a return path.
  if (role === "guest") {
    if (isApi) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(url);
  }

  // Signed in but under-privileged → API gets 403; pages bounce home (don't leak).
  if (!canAccess(role, pathname)) {
    if (isApi) return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  // Seller approval gate: an unapproved seller may only reach the application
  // and the "pending" screen — never the dashboard/tools.
  if (pathname.startsWith("/seller") && role === "seller") {
    const approved = req.auth?.user?.sellerStatus === "approved";
    const allowed = pathname.startsWith("/seller/register") || pathname.startsWith("/seller/pending");
    if (!approved && !allowed) return NextResponse.redirect(new URL("/seller/pending", req.nextUrl.origin));
  }

  return NextResponse.next();
});

// Only run on app + protected API routes; skip static assets & _next internals.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|woff2?)$).*)",
  ],
};
