#!/usr/bin/env node
/* ============================================================================
 * apply-catalog — re-injects data/catalog/catalog.json into the cloned HTML
 * fragments that display product cards (homepage carousels + PLP grid), so the
 * baked-in product display stays in sync with the data layer.
 *
 * Runs automatically after `npm run import:csv`. The React component pages
 * (account, wishlist, search, cart, checkout, PDP recommendations) already read
 * the data layer live, so they need no re-application.
 * ========================================================================== */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SEC = path.join(ROOT, "components", "sections");
const MOB = path.join(ROOT, "components", "mobile");
const PLP = path.join(ROOT, "components", "plp");
const products = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "catalog", "catalog.json"), "utf8"));
const inr = (n) => "₹" + Number(n).toLocaleString("en-IN");

function replInner(chunk, cls, val) {
  return chunk.replace(new RegExp(`(<p class="[^"]*\\b${cls}\\b[^"]*">)([\\s\\S]*?)(</p>)`), (m, a, _b, c) => a + val + c);
}
function swapCard(chunk, p) {
  chunk = chunk.replace(/<img\b[^>]*?>/, `<img src="${p.image}" alt="${p.title.replace(/"/g, "")}" sizes="25vw" class=" h-full w-full object-contain " fetchpriority="auto" width="400">`);
  chunk = replInner(chunk, "cmYHDd", `(<!-- -->${p.rating}<!-- -->)`);
  chunk = replInner(chunk, "gFAntO", p.title);
  chunk = replInner(chunk, "gmVAHq", inr(p.price));
  chunk = replInner(chunk, "dOKzvH", inr(p.compareAt));
  chunk = replInner(chunk, "IXBqP", `${p.discount}% OFF`);
  return chunk;
}
// Carousels: split by swiper-slide, assign products sequentially (offset per section)
function applyCarousels(dir, files) {
  files.forEach((f, idx) => {
    const fp = path.join(dir, f);
    if (!fs.existsSync(fp)) return;
    let s = fs.readFileSync(fp, "utf8");
    const parts = s.split(/(<div class="swiper-slide)/);
    let out = parts[0], pi = idx * 4;
    for (let k = 1; k < parts.length; k += 2) {
      const delim = parts[k], content = parts[k + 1] ?? "";
      out += delim + swapCard(content, products[pi % products.length]); pi++;
    }
    fs.writeFileSync(fp, out);
  });
}
// PLP grid: ordered per-class replacement (each card has exactly one of each field)
function applyGrid(fp) {
  if (!fs.existsSync(fp)) return;
  let s = fs.readFileSync(fp, "utf8");
  const field = { gFAntO: (p) => p.title, gmVAHq: (p) => inr(p.price), dOKzvH: (p) => inr(p.compareAt), IXBqP: (p) => `${p.discount}% OFF`, cmYHDd: (p) => `(<!-- -->${p.rating}<!-- -->)` };
  for (const [cls, fn] of Object.entries(field)) {
    let i = 0;
    s = s.replace(new RegExp(`(<p class="[^"]*\\b${cls}\\b[^"]*">)([\\s\\S]*?)(</p>)`, "g"), (m, a, _b, c) => a + fn(products[i++ % products.length]) + c);
  }
  let j = 0;
  s = s.replace(/<img\b[^>]*object-contain[^>]*>/g, () => {
    const p = products[j++ % products.length];
    return `<img src="${p.image}" alt="${p.title.replace(/"/g, "")}" sizes="25vw" class=" h-full w-full object-contain " fetchpriority="auto" width="400">`;
  });
  fs.writeFileSync(fp, s);
}

const carousels = ["sec-02-dental-instruments-consu", "sec-03-lab-bestsellers-view-all", "sec-05-premium-diagnostics-ot-h", "sec-06-top-selling-consumables-", "sec-07-dental-equipment-zone-vi", "sec-08-diagnostic-precision-pro", "sec-09-top-selling-critical-car"].map((n) => n + ".html");
const mcarousels = ["m-dental", "m-lab", "m-premium", "m-consumables", "m-dental-equip", "m-promo", "m-critical"].map((n) => n + ".html");
applyCarousels(SEC, carousels);
applyCarousels(MOB, mcarousels);
applyGrid(path.join(PLP, "desktop.html"));
applyGrid(path.join(PLP, "mobile.html"));
console.log(`✓ Re-applied ${products.length} products to homepage carousels + PLP grid.`);
