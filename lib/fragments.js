import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "components");

// dir: "sections" (desktop) or "mobile"
export function loadManifest(dir = "sections") {
  return JSON.parse(fs.readFileSync(path.join(ROOT, dir, "manifest.json"), "utf8"));
}

export function loadHtml(name, dir = "sections") {
  return fs.readFileSync(path.join(ROOT, dir, name + ".html"), "utf8");
}

// The Phase-1 static home fragments stub every product card with a single demo
// link, which 404s now that the storefront is live. Rewrite those links to real
// catalogue handles (round-robin) so each card opens a valid PDP. Nothing is
// hardcoded — the handles come from the live catalogue; with no catalogue the
// links fall back to the product-listing page so they never 404.
const PLACEHOLDER_HREF = "/products/dr-awish-glow-care-combo";

export function makeProductLinker(handles) {
  const list = (handles || []).filter(Boolean);
  let i = 0;
  return (html) => {
    if (typeof html !== "string" || !html.includes(PLACEHOLDER_HREF)) return html;
    if (!list.length) return html.split(PLACEHOLDER_HREF).join("/products");
    return html.replaceAll(PLACEHOLDER_HREF, () => "/products/" + list[i++ % list.length]);
  };
}
