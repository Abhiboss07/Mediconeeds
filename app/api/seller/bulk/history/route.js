// Import history for the current seller — batch metadata + counts (no row
// payloads, so the list stays light).
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";
import { dbConnect } from "@/lib/db/mongoose";
import { ImportBatch } from "@/lib/db/models/ImportBatch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  await dbConnect();
  const batches = await ImportBatch.find({ seller: seller._id })
    .select("-rows").sort({ createdAt: -1 }).limit(100).lean();

  return NextResponse.json({
    ok: true,
    batches: batches.map((b) => ({
      id: String(b._id),
      filename: b.filename,
      source: b.source,
      status: b.status,
      hasImagesZip: b.hasImagesZip,
      counts: b.counts,
      isRetry: !!b.retryOf,
      createdAt: b.createdAt,
      completedAt: b.completedAt,
    })),
  });
}
