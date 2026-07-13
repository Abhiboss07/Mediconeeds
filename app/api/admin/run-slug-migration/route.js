// TEMPORARY admin-only endpoint to run the slug-index migration on a host where
// no shell is available (Render free plan). Admin-authenticated. Idempotent.
// REMOVE this route (and lib/db/migrations/slugIndex.js) once the migration has
// run successfully in production — it must not remain in the deployed app.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { migrateSlugIndex } from "@/lib/db/migrations/slugIndex";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ success: false, error: "Forbidden" }, { status: g.status });
  try {
    const result = await migrateSlugIndex();
    return NextResponse.json(result, { status: result.success ? 200 : 409 });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message || "Migration error" }, { status: 500 });
  }
}
