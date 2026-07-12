// Parse + validate an uploaded CSV/XLSX (+ optional Images ZIP), resolve images,
// and persist an ImportBatch (status "validated"). Returns a preview grid and
// summary. Nothing is written to the catalogue here — publishing happens later
// via /upload. Auth: seller only. Size-capped + rate-limited.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";
import { dbConnect } from "@/lib/db/mongoose";
import { ImportBatch } from "@/lib/db/models/ImportBatch";
import { parseFile } from "@/lib/bulk/parse";
import { validateRows, summarize } from "@/lib/bulk/validate";
import { buildZipIndex, resolveRowImages } from "@/lib/bulk/images";
import { getKnownCategories, getExistingSkus, previewRow } from "@/lib/bulk/service";
import { REQUIRED_KEYS, COLUMNS } from "@/lib/bulk/columns";
import { rateLimit } from "@/lib/bulk/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_FILE = 20 * 1024 * 1024; // 20 MB
const MAX_ZIP = 500 * 1024 * 1024; // 500 MB
const bad = (error, status = 422, extra = {}) => NextResponse.json({ ok: false, error, ...extra }, { status });

export async function POST(req) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return bad("No seller profile", 403);

  const rl = rateLimit(`bulk-validate:${seller._id}`, { max: 20, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: "Too many uploads — please wait a moment." }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });

  let form;
  try { form = await req.formData(); } catch { return bad("Invalid upload (expected multipart form-data)", 400); }
  const file = form.get("file");
  const zip = form.get("zip");
  if (!file || typeof file === "string") return bad("No file uploaded", 400);
  if (file.size > MAX_FILE) return bad(`File exceeds the ${MAX_FILE / 1048576} MB limit`, 413);
  if (zip && typeof zip !== "string" && zip.size > MAX_ZIP) return bad(`Images ZIP exceeds the ${MAX_ZIP / 1048576} MB limit`, 413);

  // Parse
  let parsed;
  try { parsed = parseFile(Buffer.from(await file.arrayBuffer()), file.name); }
  catch (e) { return bad(e.message || "Could not read the file"); }
  if (!parsed.rows.length) return bad("No data rows found in the file");

  // Required columns present?
  const present = new Set(parsed.headers.filter((h) => h.key).map((h) => h.key));
  const missing = REQUIRED_KEYS.filter((k) => !present.has(k));
  if (missing.length) {
    const labels = COLUMNS.filter((c) => missing.includes(c.key)).map((c) => c.header);
    return bad(`Missing required column(s): ${labels.join(", ")}`, 422, { missingColumns: labels });
  }

  await dbConnect();
  const [knownCategories, existingSkus] = await Promise.all([getKnownCategories(), getExistingSkus(seller._id)]);

  const validated = validateRows(parsed.rows, { knownCategories, existingSkus });

  // Resolve images (URLs pass through; ZIP filenames → data-URIs; else placeholder).
  let zipIndex = { byName: new Map(), byStem: new Map(), skipped: [], limitReached: false };
  if (zip && typeof zip !== "string") {
    try { zipIndex = buildZipIndex(Buffer.from(await zip.arrayBuffer())); } catch { /* ignore bad zip */ }
  }
  for (const v of validated) {
    const res = resolveRowImages(v.normalized.images, v.sku, zipIndex);
    v.normalized.images = res.images;
    if (res.unresolved.length) { v.warnings.push(`Image not found in ZIP: ${res.unresolved.join(", ")}`); if (v.status === "valid") v.status = "warning"; }
  }

  const counts = { ...summarize(validated), success: 0, failed: 0, pending: 0, skipped: 0 };
  const batch = await ImportBatch.create({
    seller: seller._id,
    sellerName: seller.company || seller.owner || "Seller",
    filename: file.name || "upload.csv",
    source: parsed.source || "csv",
    hasImagesZip: !!(zip && typeof zip !== "string"),
    status: "validated",
    counts,
    rows: validated.map((v) => ({ rowIndex: v.rowIndex, data: v.normalized, status: v.status, issues: v.errors, warnings: v.warnings, sku: v.sku, name: v.name })),
  });

  return NextResponse.json({
    ok: true,
    batchId: String(batch._id),
    summary: counts,
    rows: batch.rows.map(previewRow),
    knownCategories,
    unknownHeaders: parsed.unknown || [],
    truncated: !!parsed.truncated,
    zipInfo: { used: batch.hasImagesZip, matched: zipIndex.byName.size, skipped: zipIndex.skipped.length, limitReached: zipIndex.limitReached },
  });
}
