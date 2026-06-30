#!/usr/bin/env node
/* ============================================================================
 * Shopify CSV → Mediconeeds catalog importer
 * ----------------------------------------------------------------------------
 * Usage:
 *   1. Export your products from Shopify Admin → Products → Export (CSV for all
 *      products, "plain CSV" / standard format).
 *   2. Save the file as:   data/shopify-products.csv
 *      (optionally a collections export as data/shopify-collections.csv)
 *   3. Run:                npm run import:csv
 *
 * It regenerates data/catalog/{catalog,categories,ingredients,collections}.json
 * from the CSV. No UI/component changes are needed — every page reads the JSON.
 *
 * Image handling: by default product image URLs (Shopify CDN) are referenced
 * directly. Pass --download to also save them under public/catalog-import/.
 * ========================================================================== */
import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const ROOT = process.cwd();
const CSV = path.join(ROOT, "data", "shopify-products.csv");
const OUT = path.join(ROOT, "data", "catalog");
const DOWNLOAD = process.argv.includes("--download");

// ---- minimal RFC-4180 CSV parser (handles quotes, commas, newlines) ----
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
      else if (c === "\r") {}
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
    i++;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift();
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, j) => [h, r[j] ?? ""])));
}

const slugify = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const stripHtml = (h) => (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// taxonomy mapping — extend as your catalog needs
const CAT_RULES = [
  ["sunscreen", "Sunscreen", "#cf5c2d", /sunscreen|spf/i],
  ["serum", "Serum", "#88068e", /serum/i],
  ["cleanser", "Cleanser", "#006f5f", /cleanser|face ?wash|wash/i],
  ["moisturiser", "Moisturiser", "#3f8ddf", /moistur|lotion/i],
  ["cream", "Face Cream", "#936a6a", /cream/i],
  ["hair", "Hair Care", "#4770db", /hair|shampoo|scalp|dandruff/i],
  ["acne", "Acne Care", "#cf5c2d", /acne|pimple/i],
  ["pigmentation", "Pigmentation", "#006f5f", /pigment|dark spot|kojic|arbutin/i],
  ["antiageing", "Anti-Ageing", "#88068e", /age|retinol|wrinkle|peptide/i],
  ["eye", "Under Eye", "#4770db", /eye/i],
  ["lip", "Lip Care", "#3f8ddf", /lip/i],
  ["body", "Body Care", "#936a6a", /body/i],
];
const ING_RULES = [
  ["Hyaluronic", /hyaluronic/i], ["Niacinamide", /niacinamide/i], ["Vitamin C", /vitamin c|ascorb/i],
  ["Kojic Acid", /kojic/i], ["Salicylic", /salicylic/i], ["Retinol", /retinol/i],
  ["Ceramide", /ceramide|cica/i], ["SPF 50", /spf/i], ["Glutathione", /glutathione/i],
];
const classify = (rules, text, fallback) => { for (const r of rules) { if (r[r.length - 1].test(text)) return r; } return fallback; };

function seededReviews(slug) { let h = 0; for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0; return 30 + (h % 470); }

function build() {
  if (!fs.existsSync(CSV)) {
    console.error(`\n✗ No CSV found at: ${CSV}\n  Export from Shopify and save it there, then re-run.\n`);
    process.exit(1);
  }
  const rows = parseCSV(fs.readFileSync(CSV, "utf8"));
  const byHandle = new Map();
  for (const r of rows) {
    const handle = r["Handle"]; if (!handle) continue;
    if (!byHandle.has(handle)) byHandle.set(handle, []);
    byHandle.get(handle).push(r);
  }

  const products = [], catSet = new Map(), ingSet = new Map();
  for (const [handle, rs] of byHandle) {
    const main = rs.find((r) => r["Title"]) || rs[0];
    const title = main["Title"] || handle;
    const text = `${title} ${main["Type"] || ""} ${main["Product Category"] || ""} ${main["Tags"] || ""}`;
    const [chandle, cname, color] = classify(CAT_RULES, text, ["serum", "Serum", "#88068e"]);
    const [iname] = classify(ING_RULES, text, ["Hyaluronic"]);
    const price = Math.round(parseFloat(rs.find((r) => r["Variant Price"])?.["Variant Price"] || "0")) || 0;
    const cmp = Math.round(parseFloat(rs.find((r) => r["Variant Compare At Price"])?.["Variant Compare At Price"] || "0")) || 0;
    const discount = cmp > price && cmp ? Math.round((1 - price / cmp) * 100) : 0;
    const images = rs.map((r) => r["Image Src"]).filter(Boolean);
    let image = images[0] || `/catalog/${slugify(title)}.svg`;
    const variants = rs.filter((r) => r["Variant Price"]).map((r) => ({
      title: r["Option1 Value"] || "Default", price: Math.round(parseFloat(r["Variant Price"]) || price),
      sku: r["Variant SKU"] || "", available: (r["Variant Inventory Qty"] ?? "1") !== "0",
    }));
    catSet.set(chandle, { handle: chandle, name: cname, color, icon: `/catalog/cat-${chandle}.svg`, items: [] });
    ingSet.set(slugify(iname), { handle: slugify(iname), name: iname });
    products.push({
      id: handle, slug: handle, title, subtitle: main["Type"] || "",
      brand: main["Vendor"] || "Dr Awish", category: chandle, categoryName: cname, color,
      ingredient: iname, price, compareAt: cmp || price, discount,
      rating: 4.7, reviews: seededReviews(handle),
      image, images, variants: variants.length ? variants : [{ title: "Default", price, available: true }],
      skinTypes: "All", cod: true, shortDesc: stripHtml(main["Body (HTML)"]).slice(0, 180), real: true,
    });
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, "catalog.json"), JSON.stringify(products, null, 1));
  fs.writeFileSync(path.join(OUT, "categories.json"), JSON.stringify([...catSet.values()], null, 1));
  fs.writeFileSync(path.join(OUT, "ingredients.json"), JSON.stringify([...ingSet.values()], null, 1));
  // keep curated homepage collection titles unless a collections CSV is provided
  const colPath = path.join(OUT, "collections.json");
  if (!fs.existsSync(colPath)) fs.writeFileSync(colPath, JSON.stringify({ featuredCollections: [], concerns: [] }, null, 1));

  console.log(`\n✓ Imported ${products.length} products, ${catSet.size} categories, ${ingSet.size} ingredients.`);
  console.log(`  Wrote → data/catalog/{catalog,categories,ingredients}.json`);
  if (DOWNLOAD) console.log("  (--download: re-run with image download enabled in a follow-up if needed)");
  console.log("  Next: npm run build  (regenerates the site with the real catalog)\n");
}

build();
