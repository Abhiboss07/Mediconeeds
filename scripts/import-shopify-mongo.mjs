#!/usr/bin/env node
/* ============================================================================
 * Shopify Product CSV  ->  MongoDB (CatalogProduct)
 * ----------------------------------------------------------------------------
 * Full-fidelity importer: products, variants, images, inventory, SEO, tags,
 * vendor, collections, compare-at, SKU, barcode, weight, product type.
 *
 * Dedup by Handle: existing handle -> UPDATE, new handle -> CREATE.
 *
 * Usage:
 *   node --env-file=.env.local scripts/import-shopify-mongo.mjs [options]
 * Options:
 *   --file=<path>   CSV path (default: data/shopify-products.csv)
 *   --dry-run       parse + validate + print report, write nothing
 *   --resume        continue a previously interrupted run (skips done handles)
 *   --no-rollback   do not roll back on fatal error (default: rollback ON)
 *   --quiet         suppress per-product log lines
 * ========================================================================== */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { CatalogProduct } from "../lib/db/models/CatalogProduct.js";

const ROOT = process.cwd();
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.split("=").slice(1).join("=") : d; };
const has = (k) => process.argv.includes(`--${k}`);
const CSV = path.resolve(ROOT, arg("file", "data/shopify-products.csv"));
const CHECKPOINT = path.join(ROOT, "data", ".import-checkpoint.json");
const DRY = has("dry-run");
const RESUME = has("resume");
const ROLLBACK = !has("no-rollback");
const QUIET = has("quiet");

// ---------------- CSV parser (RFC-4180: quotes, commas, newlines) ----------
function parseCSV(text) {
  const rows = [];
  let row = [], field = "", i = 0, q = false;
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\r") { /* skip */ }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
    i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift().map((h) => h.trim());
  return rows
    .filter((r) => r.some((c) => c !== "" && c != null))
    .map((r) => Object.fromEntries(header.map((h, j) => [h, (r[j] ?? "").trim()])));
}

// ---------------- helpers --------------------------------------------------
const num = (v) => { if (v == null || v === "") return null; const n = Number(String(v).replace(/[^0-9.\-]/g, "")); return Number.isFinite(n) ? n : null; };
const boolish = (v) => /^(true|yes|1|active)$/i.test(String(v || "").trim());
const splitList = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);
const col = (row, ...names) => { for (const n of names) if (n in row && row[n] !== "") return row[n]; return ""; };
const findColKey = (row, re) => Object.keys(row).find((k) => re.test(k));

import { getPresentation } from "../lib/catalog/taxonomy.js";

// ---------------- group rows by handle -> product docs ---------------------
function buildProducts(rows) {
  const groups = new Map(); // handle -> rows[]
  const orphans = [];
  for (const r of rows) {
    const handle = col(r, "Handle").trim();
    if (!handle) { orphans.push(r); continue; }
    if (!groups.has(handle)) groups.set(handle, []);
    groups.get(handle).push(r);
  }

  const products = [];
  for (const [handle, grp] of groups) {
    const head = grp.find((r) => col(r, "Title")) || grp[0];
    const collKey = findColKey(head, /^collections?$/i);

    // options
    const options = [];
    for (const n of ["Option1", "Option2", "Option3"]) {
      const name = col(head, `${n} Name`);
      if (name) {
        const values = [...new Set(grp.map((r) => col(r, `${n} Value`)).filter(Boolean))];
        options.push({ name, values });
      }
    }

    // variants — a row is a variant if it carries variant/option/price data
    const variants = [];
    grp.forEach((r, idx) => {
      const price = num(col(r, "Variant Price"));
      const sku = col(r, "Variant SKU");
      const opt1 = col(r, "Option1 Value");
      const hasVariant = price != null || sku || (opt1 && idx === 0) || (opt1 && !variants.some((v) => v.option1 === opt1));
      if (!hasVariant) return;
      const title = [col(r, "Option1 Value"), col(r, "Option2 Value"), col(r, "Option3 Value")].filter(Boolean).join(" / ");
      variants.push({
        sku, barcode: col(r, "Variant Barcode"),
        title, option1: col(r, "Option1 Value"), option2: col(r, "Option2 Value"), option3: col(r, "Option3 Value"),
        price: price ?? 0, compareAt: num(col(r, "Variant Compare At Price")) ?? 0,
        grams: num(col(r, "Variant Grams")) ?? 0, weightUnit: col(r, "Variant Weight Unit") || "g",
        inventoryQty: num(col(r, "Variant Inventory Qty")) ?? 0,
        inventoryPolicy: col(r, "Variant Inventory Policy") || "deny",
        inventoryTracker: col(r, "Variant Inventory Tracker"),
        fulfillmentService: col(r, "Variant Fulfillment Service") || "manual",
        requiresShipping: col(r, "Variant Requires Shipping") === "" ? true : boolish(col(r, "Variant Requires Shipping")),
        taxable: col(r, "Variant Taxable") === "" ? true : boolish(col(r, "Variant Taxable")),
        imageSrc: col(r, "Variant Image"),
        position: idx + 1,
      });
    });

    // images — dedup by src, keep position order
    const imgMap = new Map();
    grp.forEach((r) => {
      const src = col(r, "Image Src");
      if (src && !imgMap.has(src)) imgMap.set(src, { src, position: num(col(r, "Image Position")) ?? imgMap.size + 1, alt: col(r, "Image Alt Text") });
    });
    const images = [...imgMap.values()].sort((a, b) => a.position - b.position);

    const tags = splitList(col(head, "Tags"));
    const type = col(head, "Type");
    const pres = getPresentation(type, tags, col(head, "Title"));

    products.push({
      handle,
      title: col(head, "Title"),
      bodyHtml: col(head, "Body (HTML)", "Body HTML"),
      vendor: col(head, "Vendor"),
      productType: type,
      productCategory: col(head, "Product Category"),
      tags,
      collections: collKey ? splitList(head[collKey]) : [],
      published: col(head, "Published") === "" ? true : boolish(col(head, "Published")),
      status: (() => { const s = (col(head, "Status") || "active").toLowerCase(); return ["active", "draft", "archived"].includes(s) ? s : "active"; })(),
      seo: { title: col(head, "SEO Title"), description: col(head, "SEO Description") },
      options, variants, images,
      ...pres,
      rating: num(col(head, "Rating")) ?? 0,
      reviews: num(col(head, "Reviews")) ?? 0,
      source: "shopify-csv",
      importedAt: new Date(),
      _rowCount: grp.length,
    });
  }
  return { products, orphans };
}

// ---------------- validation ----------------------------------------------
function validate(products, orphans) {
  const errors = [], warnings = [];
  if (orphans.length) errors.push(`${orphans.length} row(s) skipped: missing Handle`);
  const seen = new Set();
  const valid = [];
  for (const p of products) {
    const id = p.handle;
    const errs = [];
    if (!p.title) errs.push("missing Title");
    const priced = p.variants.filter((v) => v.price > 0);
    if (!p.variants.length) errs.push("no variants");
    else if (!priced.length) errs.push("no variant has a valid price");
    if (seen.has(id)) errs.push("duplicate handle within file");
    seen.add(id);

    // warnings (non-fatal, still imported)
    p.variants.forEach((v, i) => {
      if (v.inventoryQty < 0) { warnings.push(`${id} variant#${i + 1}: negative inventory (${v.inventoryQty}) -> 0`); v.inventoryQty = 0; }
      if (v.compareAt && v.compareAt < v.price) { warnings.push(`${id} variant#${i + 1}: compareAt < price -> ignored`); v.compareAt = 0; }
    });
    if (!p.images.length) warnings.push(`${id}: no images`);
    if (!p.productType) warnings.push(`${id}: no product Type (category fallback used)`);

    if (errs.length) errors.push(`${id}: ${errs.join("; ")} -> SKIPPED`);
    else valid.push(p);
  }
  return { valid, errors, warnings };
}

// ---------------- checkpoint (resume) --------------------------------------
const loadCheckpoint = () => { try { return JSON.parse(fs.readFileSync(CHECKPOINT, "utf8")); } catch { return null; } };
const saveCheckpoint = (data) => fs.writeFileSync(CHECKPOINT, JSON.stringify(data, null, 2));
const clearCheckpoint = () => { try { fs.unlinkSync(CHECKPOINT); } catch {} };

// ---------------- main -----------------------------------------------------
async function main() {
  console.log(`\nShopify -> MongoDB importer`);
  console.log(`  file:     ${CSV}`);
  console.log(`  mode:     ${DRY ? "DRY-RUN (no writes)" : RESUME ? "RESUME" : "IMPORT"}${ROLLBACK && !DRY && !RESUME ? " (+rollback)" : ""}\n`);

  if (!fs.existsSync(CSV)) { console.error(`✗ CSV not found: ${CSV}`); process.exit(1); }
  const rows = parseCSV(fs.readFileSync(CSV, "utf8"));
  const { products, orphans } = buildProducts(rows);
  const { valid, errors, warnings } = validate(products, orphans);

  // ----- validation report -----
  console.log("── VALIDATION REPORT ──────────────────────────────");
  console.log(`  rows parsed:       ${rows.length}`);
  console.log(`  products grouped:  ${products.length}`);
  console.log(`  valid to import:   ${valid.length}`);
  console.log(`  errors:            ${errors.length}`);
  console.log(`  warnings:          ${warnings.length}`);
  errors.forEach((e) => console.log(`   ✗ ${e}`));
  warnings.forEach((w) => console.log(`   ⚠ ${w}`));
  console.log("");

  if (DRY) { console.log("Dry-run complete — nothing written."); process.exit(errors.length ? 2 : 0); }
  if (!valid.length) { console.error("Nothing valid to import — aborting."); process.exit(2); }

  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error("✗ MONGODB_URI not set"); process.exit(1); }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  // resume checkpoint
  let done = new Set();
  if (RESUME) { const cp = loadCheckpoint(); if (cp?.doneHandles) { done = new Set(cp.doneHandles); console.log(`Resuming — ${done.size} handle(s) already done.\n`); } }
  const todo = valid.filter((p) => !done.has(p.handle));

  // snapshot for rollback (only handles we will touch this run)
  const snapshots = new Map();
  if (ROLLBACK && !RESUME) {
    for (const p of todo) {
      const existing = await CatalogProduct.findOne({ handle: p.handle }).lean();
      snapshots.set(p.handle, existing || null);
    }
  }

  const summary = { created: 0, updated: 0, variants: 0, images: 0, failed: 0 };
  const cp = { file: CSV, startedAt: new Date().toISOString(), doneHandles: [...done] };

  try {
    for (const p of todo) {
      const existing = await CatalogProduct.findOne({ handle: p.handle });
      const isNew = !existing;
      const doc = existing || new CatalogProduct({ handle: p.handle });
      Object.assign(doc, p);
      delete doc._rowCount;
      await doc.save(); // pre-save keeps denormalised fields in sync
      summary[isNew ? "created" : "updated"]++;
      summary.variants += p.variants.length;
      summary.images += p.images.length;
      cp.doneHandles.push(p.handle);
      saveCheckpoint(cp);
      if (!QUIET) console.log(`  ${isNew ? "＋ created" : "↻ updated"}  ${p.handle}  (${p.variants.length}v ${p.images.length}img)`);
    }
  } catch (err) {
    summary.failed++;
    console.error(`\n✗ FATAL during import: ${err.message}`);
    if (ROLLBACK && !RESUME) {
      console.error("↩ Rolling back this run…");
      for (const [handle, snap] of snapshots) {
        if (snap) await CatalogProduct.replaceOne({ handle }, snap, { upsert: true });
        else await CatalogProduct.deleteOne({ handle });
      }
      console.error("↩ Rollback complete — database restored to pre-import state.");
      clearCheckpoint();
    } else {
      console.error("Progress saved to checkpoint — rerun with --resume to continue.");
    }
    await mongoose.disconnect();
    process.exit(1);
  }

  clearCheckpoint();
  await mongoose.disconnect();

  console.log("\n── IMPORT SUMMARY ─────────────────────────────────");
  console.log(`  created:   ${summary.created}`);
  console.log(`  updated:   ${summary.updated}`);
  console.log(`  variants:  ${summary.variants}`);
  console.log(`  images:    ${summary.images}`);
  console.log(`  skipped:   ${errors.length} (validation)`);
  console.log(`  failed:    ${summary.failed}`);
  console.log("✓ Import complete.\n");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
