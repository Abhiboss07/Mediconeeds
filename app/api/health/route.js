// Liveness probe for Render (and any uptime monitor). Intentionally does NOT hit
// the database — a transient Atlas blip should not cause Render to kill a healthy
// process. Returns 200 whenever the Node server is up and serving.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "mediconeeds-web",
    // Deployed git SHA/branch. Render injects RENDER_GIT_* at build+runtime, so
    // this endpoint definitively reports which commit is actually live. Falls
    // back to "unknown" when the vars aren't present (e.g. local dev).
    commit: process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || "unknown",
    branch: process.env.RENDER_GIT_BRANCH || "unknown",
    uptime: Math.round(process.uptime()),
    ts: new Date().toISOString(),
  });
}
