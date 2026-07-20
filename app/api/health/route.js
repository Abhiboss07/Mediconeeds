// Health endpoints — deliberately split into two probes (K8s/Render pattern):
//
//   • LIVENESS (default GET /api/health): "is the Node process up and serving?"
//     Intentionally does NOT touch the database — a transient Atlas blip must not
//     make the orchestrator kill an otherwise-healthy process (restart loops).
//     Always 200 when the server responds.
//
//   • READINESS (GET /api/health?ready=1): "can this instance actually serve
//     traffic right now?" Pings MongoDB and returns 503 if the dependency is
//     unreachable, so a load balancer can drain (but not kill) the instance.
//
// This resolves QA finding L-4: the monitor gets a DB-aware signal WITHOUT the
// self-inflicted restart-loop risk of making liveness depend on Atlas.
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db/mongoose";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const wantReady = new URL(req.url).searchParams.get("ready") != null;
  const base = { ok: true, service: "mediconeeds-web", ts: new Date().toISOString() };

  // --- Readiness: verify the database actually answers within a short budget ---
  if (wantReady) {
    const started = Date.now();
    try {
      await dbConnect();
      // Cheap round-trip that proves the connection is live and responsive.
      await mongoose.connection.db.admin().ping();
      return NextResponse.json({ ...base, ready: true, db: "up", dbLatencyMs: Date.now() - started });
    } catch (err) {
      console.error("[HEALTH] readiness check failed:", err?.message || err);
      return NextResponse.json(
        { ok: false, ready: false, db: "down", service: base.service, ts: base.ts },
        { status: 503 },
      );
    }
  }

  // --- Liveness: build metadata only for an authenticated admin (no leak) ---
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
