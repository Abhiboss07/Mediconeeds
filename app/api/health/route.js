// Liveness probe for Render (and any uptime monitor). Intentionally does NOT hit
// the database — a transient Atlas blip should not cause Render to kill a healthy
// process. Returns 200 whenever the Node server is up and serving.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "mediconeeds-web",
    uptime: Math.round(process.uptime()),
    ts: new Date().toISOString(),
  });
}
