// ============================================================================
// Bulk-upload file parsing. CSV via PapaParse; XLSX by reading the OOXML parts
// directly with adm-zip (no heavy/vulnerable xlsx dependency). Returns raw
// string cell values keyed by canonical column — numeric coercion + formula
// hardening happen in validate.js so number fields (e.g. "-5") parse correctly.
// Legacy binary .xls (BIFF) is not supported — sellers are asked to re-save as
// CSV or XLSX.
// ============================================================================
import "server-only";
import Papa from "papaparse";
import AdmZip from "adm-zip";
import { resolveHeader } from "./columns.js";

const MAX_ROWS = 10000; // hard cap — a single upload can carry up to 10k products

function mapHeaders(rawHeaders) {
  const headers = rawHeaders.map((h) => ({ raw: String(h || "").trim(), key: resolveHeader(h) }));
  const unknown = headers.filter((h) => h.raw && !h.key).map((h) => h.raw);
  return { headers, unknown };
}

function rowsFromMatrix(matrix) {
  const nonEmpty = matrix.filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
  if (!nonEmpty.length) return { headers: [], unknown: [], rows: [] };
  const { headers, unknown } = mapHeaders(nonEmpty[0]);
  const rows = [];
  for (let i = 1; i < nonEmpty.length && rows.length < MAX_ROWS; i++) {
    const cells = nonEmpty[i];
    const obj = {};
    headers.forEach((h, idx) => { if (h.key) obj[h.key] = String(cells[idx] ?? "").trim(); });
    rows.push({ rowIndex: rows.length + 1, data: obj });
  }
  const truncated = nonEmpty.length - 1 > MAX_ROWS;
  return { headers, unknown, rows, truncated };
}

export function parseCsv(text) {
  const res = Papa.parse(text, { skipEmptyLines: "greedy" });
  return rowsFromMatrix(res.data || []);
}

// ---- Minimal XLSX reader --------------------------------------------------
const COL_RE = /^([A-Z]+)\d+$/;
const colToIndex = (ref) => {
  const m = COL_RE.exec(ref || "");
  if (!m) return 0;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};
const decodeXml = (s) =>
  String(s).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d)).replace(/&amp;/g, "&");

function readSharedStrings(zip) {
  const entry = zip.getEntry("xl/sharedStrings.xml");
  if (!entry) return [];
  const xml = entry.getData().toString("utf8");
  const out = [];
  for (const si of xml.match(/<si>[\s\S]*?<\/si>/g) || []) {
    const text = (si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map((t) => decodeXml(t.replace(/<[^>]+>/g, ""))).join("");
    out.push(text);
  }
  return out;
}

export function parseXlsx(buffer) {
  const zip = new AdmZip(buffer);
  const shared = readSharedStrings(zip);
  // First worksheet (workbook order — sheet1.xml is the safe default).
  const sheetEntry = zip.getEntry("xl/worksheets/sheet1.xml") ||
    zip.getEntries().find((e) => /^xl\/worksheets\/.*\.xml$/.test(e.entryName));
  if (!sheetEntry) throw new Error("No worksheet found in the XLSX file.");
  const xml = sheetEntry.getData().toString("utf8");

  const matrix = [];
  for (const rowXml of xml.match(/<row[\s\S]*?<\/row>/g) || []) {
    const cells = [];
    for (const c of rowXml.match(/<c[^>]*>[\s\S]*?<\/c>|<c[^>]*\/>/g) || []) {
      const ref = (c.match(/r="([A-Z]+\d+)"/) || [])[1] || "";
      const t = (c.match(/t="([^"]+)"/) || [])[1] || "";
      let val = "";
      if (t === "inlineStr") {
        val = (c.match(/<t[^>]*>([\s\S]*?)<\/t>/g) || []).map((x) => decodeXml(x.replace(/<[^>]+>/g, ""))).join("");
      } else {
        const v = (c.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        if (v != null) val = t === "s" ? shared[+v] ?? "" : decodeXml(v);
      }
      cells[colToIndex(ref)] = val;
    }
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = "";
    matrix.push(cells);
  }
  return rowsFromMatrix(matrix);
}

/** Parse an uploaded file buffer by extension. */
export function parseFile(buffer, filename) {
  const ext = (filename || "").toLowerCase().split(".").pop();
  if (ext === "csv" || ext === "txt") return { source: "csv", ...parseCsv(buffer.toString("utf8")) };
  if (ext === "xlsx") return { source: "xlsx", ...parseXlsx(buffer) };
  if (ext === "xls") throw new Error("Legacy .xls files aren't supported. Please re-save as CSV or XLSX.");
  // Fallback: sniff — zip magic PK\x03\x04 → xlsx, else CSV.
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) return { source: "xlsx", ...parseXlsx(buffer) };
  return { source: "csv", ...parseCsv(buffer.toString("utf8")) };
}
