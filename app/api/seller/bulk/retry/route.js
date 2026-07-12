// Re-import the FAILED rows of a previous batch: creates a fresh "validated"
// batch from those rows (re-checked against the current catalogue) so the seller
// can review/edit in the preview and publish again. Images already resolved on
// the original rows are reused.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";
import { dbConnect } from "@/lib/db/mongoose";
import { ImportBatch } from "@/lib/db/models/ImportBatch";
import { getExistingSkus, previewRow } from "@/lib/bulk/service";
import { rateLimit } from "@/lib/bulk/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function essentialErrors(d) {
  const e = [];
  if (!d.name) e.push("Product Name is required");
  if (!d.sku) e.push("SKU is required");
  if (!d.category) e.push("Category is required");
  const price = Number(d.price), mrp = Number(d.mrp);
  if (!Number.isFinite(price) || price < 0) e.push("Invalid price");
  if (mrp > 0 && mrp < price) e.push("MRP is less than Price");
  return e;
}

export async function POST(req) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  const rl = rateLimit(`bulk-retry:${seller._id}`, { max: 10, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many retries — please wait." }, { status: 429 });

  let body; try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const { batchId } = body || {};
  if (!batchId) return NextResponse.json({ ok: false, error: "Missing batchId" }, { status: 400 });

  await dbConnect();
  const src = await ImportBatch.findOne({ _id: batchId, seller: seller._id }).catch(() => null);
  if (!src) return NextResponse.json({ ok: false, error: "Batch not found" }, { status: 404 });

  const failed = src.rows.filter((r) => r.status === "failed");
  if (!failed.length) return NextResponse.json({ ok: false, error: "No failed rows to retry." }, { status: 422 });

  const existing = new Set((await getExistingSkus(seller._id)).map((s) => s.toLowerCase()));

  let seq = 0;
  const rows = failed.map((r) => {
    const d = { ...(r.data || {}) };
    const errors = essentialErrors(d);
    if (d.sku && existing.has(String(d.sku).toLowerCase())) errors.push("SKU already exists in your catalogue");
    const warnings = r.warnings || [];
    const status = errors.length ? "error" : warnings.length ? "warning" : "valid";
    return { rowIndex: ++seq, data: d, status, errors, warnings, sku: d.sku || "", name: d.name || "" };
  });

  const counts = {
    total: rows.length,
    valid: rows.filter((r) => r.status === "valid").length,
    warnings: rows.filter((r) => r.status === "warning").length,
    errors: rows.filter((r) => r.status === "error").length,
    success: 0, failed: 0, pending: 0, skipped: 0,
  };

  const batch = await ImportBatch.create({
    seller: seller._id,
    sellerName: src.sellerName,
    filename: `Retry of ${src.filename}`,
    source: src.source,
    hasImagesZip: src.hasImagesZip,
    status: "validated",
    retryOf: src._id,
    counts,
    rows,
  });

  return NextResponse.json({
    ok: true,
    batchId: String(batch._id),
    summary: counts,
    rows: batch.rows.map(previewRow),
    retryOf: String(src._id),
  });
}
