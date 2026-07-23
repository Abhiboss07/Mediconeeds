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

// The captured header fragments each carry a static search control: a <button>
// that opens the search overlay. On /search that control is redundant — the
// route is itself a search UI — so the header switches into "search mode": the
// button is removed from the markup (genuinely absent from the DOM, not hidden
// with CSS) and replaced by an empty slot that the live <SearchField> is
// portalled into.
//
// The slot inherits only the button's *layout* classes (how it sits in the
// header flex row) and none of its skin — <SearchField> draws its own pill, so
// copying border/background/padding across would nest two pills. It does keep a
// fixed height, which is what stops the header from resizing when React fills
// the slot on hydration.
const SEARCH_BUTTON = /<button\b[^>]*>[\s\S]*?<\/button>/g;
const SKIN = /^(border|bg-|rounded|px-|py-|p-|gap-|cursor-|overflow-|shadow)/;

export function swapHeaderSearch(html, slotId) {
  let replaced = false;
  const out = html.replace(SEARCH_BUTTON, (el) => {
    // The search control is the one that either labels itself for search or
    // renders the "Search for …" placeholder text. Other header buttons (the
    // locality picker, the account menu) must survive untouched.
    if (replaced || !/aria-label="Search products"|>Search for</.test(el)) return el;
    replaced = true;
    const cls = (/\bclass="([^"]*)"/.exec(el)?.[1] || "").split(/\s+/).filter(Boolean);
    const layout = cls.filter((c) => !SKIN.test(c));
    // Reserve the field's height up front so hydration cannot shift the header.
    if (!layout.some((c) => /^h-/.test(c))) layout.push("h-[40px]");
    return `<div id="${slotId}" class="${layout.join(" ")} min-w-0"></div>`;
  });
  if (!replaced) throw new Error(`swapHeaderSearch: no search control found for slot "${slotId}"`);
  return out;
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
