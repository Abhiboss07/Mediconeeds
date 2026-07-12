// ============================================================================
// Bulk image resolution. Three sources, in priority order per row:
//   1. Full http(s) URLs in Image1..Image5 → used as-is.
//   2. Filenames in Image1..Image5 → matched against an uploaded Images ZIP.
//   3. A ZIP image whose name matches the row SKU (e.g. VC100.jpg) → auto-attached.
// Anything unresolved falls back to an inline placeholder so a row never breaks.
//
// Storage: ZIP images are inlined as data-URIs (the current infra has no object
// store, matching the avatar approach). `storeImage()` is the single seam to
// swap in S3/Cloudinary later — return a hosted URL instead of a data-URI.
// ============================================================================
import "server-only";
import AdmZip from "adm-zip";

const MAX_IMAGE_BYTES = 512 * 1024; // 512 KB per inlined image
// Bound total inlined bytes + count so a huge ZIP can't exhaust memory or blow
// the 16 MB ImportBatch document. Beyond this, use image URLs instead.
const MAX_TOTAL_BYTES = 10 * 1024 * 1024; // 10 MB of images inlined per batch
const MAX_ENTRIES = 300;
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };

// Neutral inline SVG placeholder (self-contained, theme-agnostic).
export const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><rect width='100%' height='100%' fill='#eef2ff'/><text x='50%' y='50%' font-family='sans-serif' font-size='16' fill='#6b7280' text-anchor='middle' dominant-baseline='middle'>No image</text></svg>`
  );

const baseName = (p) => String(p).split(/[\\/]/).pop().toLowerCase().trim();
const stem = (f) => f.replace(/\.[^.]+$/, "");

/** Future object-storage seam. Today: inline data-URI. */
function storeImage(buffer, ext) {
  const mime = MIME[ext] || "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/** Index an Images ZIP: filename → data-URI, plus stem → data-URI for SKU match. */
export function buildZipIndex(zipBuffer) {
  const index = { byName: new Map(), byStem: new Map(), skipped: [], limitReached: false };
  if (!zipBuffer) return index;
  let zip;
  try { zip = new AdmZip(zipBuffer); } catch { return index; }
  let total = 0;
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const name = baseName(entry.entryName);
    const ext = (name.match(/\.([^.]+)$/) || [])[1];
    if (!ext || !MIME[ext]) continue;
    if (index.byName.size >= MAX_ENTRIES || total >= MAX_TOTAL_BYTES) { index.limitReached = true; index.skipped.push(name); continue; }
    let data;
    try { data = entry.getData(); } catch { continue; }
    if (data.length > MAX_IMAGE_BYTES) { index.skipped.push(name); continue; }
    total += data.length;
    const uri = storeImage(data, ext);
    index.byName.set(name, uri);
    index.byStem.set(stem(name), uri);
  }
  return index;
}

const isUrl = (s) => /^https?:\/\/\S+$/i.test(String(s || "").trim());

/**
 * Resolve a row's final image list.
 * @param {string[]} rawImages  values from Image1..Image5 (URLs or filenames)
 * @param {string} sku
 * @param {{byName:Map,byStem:Map}} zipIndex
 * @returns {{images:string[], usedPlaceholder:boolean, unresolved:string[]}}
 */
export function resolveRowImages(rawImages, sku, zipIndex) {
  const images = [];
  const unresolved = [];
  for (const raw of rawImages || []) {
    const v = String(raw || "").trim();
    if (!v) continue;
    if (isUrl(v)) { images.push(v); continue; }
    const hit = zipIndex?.byName?.get(baseName(v)) || zipIndex?.byStem?.get(stem(baseName(v)));
    if (hit) images.push(hit);
    else unresolved.push(v);
  }
  // SKU-named image in the ZIP (only if the row has none yet).
  if (!images.length && sku && zipIndex?.byStem?.get(String(sku).toLowerCase())) {
    images.push(zipIndex.byStem.get(String(sku).toLowerCase()));
  }
  if (!images.length) return { images: [PLACEHOLDER], usedPlaceholder: true, unresolved };
  return { images, usedPlaceholder: false, unresolved };
}
