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
