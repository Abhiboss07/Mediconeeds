// Liveness probe for Render (and any uptime monitor). Intentionally does NOT hit
// the database — a transient Atlas blip should not cause Render to kill a healthy
// process. Returns 200 whenever the Node server is up and serving.
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  // Public liveness payload — no deployment metadata exposed to anonymous callers.
  const base = { ok: true, service: "mediconeeds-web", ts: new Date().toISOString() };

  // Build metadata (commit/branch/uptime) is only returned to an authenticated
  // admin, so uptime monitors get a clean 200 while the deploy fingerprint stays
  // out of anonymous reach.
  let role;
  try { role = (await auth())?.user?.role; } catch { /* no session */ }
  if (role === "admin" || role === "superadmin") {
    return NextResponse.json({
      ...base,
      commit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || "unknown",
      branch: process.env.RENDER_GIT_BRANCH || "unknown",
      uptime: Math.round(process.uptime()),
    });
  }
  return NextResponse.json(base);
}
