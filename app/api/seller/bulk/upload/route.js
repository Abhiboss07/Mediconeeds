// Publish a CHUNK of a validated batch into real "pending" Products (the same
// approval flow as manual Add Product). Called repeatedly (≤100 rows/request)
// by the client so 1000+ products import with a progress bar and no browser
// freeze. `finalize:true` on the last call closes the batch. Idempotent per row
// (a row already "success" is never created twice).
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";
import { dbConnect } from "@/lib/db/mongoose";
import { ImportBatch } from "@/lib/db/models/ImportBatch";
import { publishRow } from "@/lib/bulk/service";
import { rateLimit } from "@/lib/bulk/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EDIT_TEXT = ["name", "sku", "brand", "category", "subcategory", "weight", "hsn", "description"];
const EDIT_NUM = ["price", "mrp", "stock", "gst"];

function essentialReason(d) {
  if (!d.name) return "Product Name is required";
  if (!d.sku) return "SKU is required";
  if (!d.category) return "Category is required";
  const price = Number(d.price), mrp = Number(d.mrp), stock = Number(d.stock), gst = Number(d.gst);
  if (!Number.isFinite(price) || price < 0) return "Invalid price";
  if (mrp > 0 && mrp < price) return "MRP is less than Price";
  if (Number.isFinite(stock) && stock < 0) return "Stock cannot be negative";
  if (Number.isFinite(gst) && (gst < 0 || gst > 28)) return "Invalid GST";
  return null;
}

export async function POST(req) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  const rl = rateLimit(`bulk-upload:${seller._id}`, { max: 120, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many requests — slow down." }, { status: 429 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const { batchId, items, finalize } = body || {};
  if (!batchId) return NextResponse.json({ ok: false, error: "Missing batchId" }, { status: 400 });
  if (items && !Array.isArray(items)) return NextResponse.json({ ok: false, error: "items must be an array" }, { status: 400 });
  if (items && items.length > 200) return NextResponse.json({ ok: false, error: "Chunk too large (max 200 rows)" }, { status: 413 });

  await dbConnect();
  const batch = await ImportBatch.findOne({ _id: batchId, seller: seller._id }).catch(() => null);
  if (!batch) return NextResponse.json({ ok: false, error: "Batch not found" }, { status: 404 });
  if (batch.status === "completed") return NextResponse.json({ ok: false, error: "This batch is already imported." }, { status: 409 });

  if (batch.status === "validated") batch.status = "importing";
  const byIndex = new Map(batch.rows.map((r) => [r.rowIndex, r]));

  let created = 0, failed = 0;
  for (const item of items || []) {
    const row = byIndex.get(item?.rowIndex);
    if (!row || row.status === "success") continue;

    const d = { ...(row.data || {}) };
    const edits = item.edits || {};
    for (const k of EDIT_TEXT) if (edits[k] !== undefined) d[k] = String(edits[k]);
    for (const k of EDIT_NUM) if (edits[k] !== undefined) d[k] = Number(edits[k]) || 0;
    if (typeof edits.imageUrl === "string" && /^https?:\/\/\S+$/i.test(edits.imageUrl.trim())) d.images = [edits.imageUrl.trim()];

    const reason = essentialReason(d);
    if (reason) { row.status = "failed"; row.reason = reason; row.data = d; failed++; continue; }

    const res = await publishRow(d, seller._id, batch._id);
    row.data = d;
    row.sku = d.sku || row.sku;
    if (res.ok) { row.status = "success"; row.product = res.productId; row.reason = ""; created++; }
    else { row.status = "failed"; row.reason = res.reason; failed++; }
  }

  if (finalize) {
    for (const r of batch.rows) if (!["success", "failed"].includes(r.status)) { r.status = "skipped"; }
    batch.status = batch.rows.some((r) => r.status === "failed") ? "partial" : "completed";
    batch.completedAt = new Date();
  }

  // Recompute canonical counts from rows.
  const c = batch.counts;
  c.success = batch.rows.filter((r) => r.status === "success").length;
  c.failed = batch.rows.filter((r) => r.status === "failed").length;
  c.skipped = batch.rows.filter((r) => r.status === "skipped").length;
  c.pending = batch.rows.filter((r) => !["success", "failed", "skipped"].includes(r.status)).length;

  batch.markModified("rows");
  batch.markModified("counts");
  await batch.save();

  return NextResponse.json({
    ok: true, batchId: String(batch._id), created, failed,
    counts: batch.counts, status: batch.status, done: !!finalize,
  });
}
