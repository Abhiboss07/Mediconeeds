// ============================================================================
// CSV writer for the sample template and the failed-rows error report. Applies
// formula-injection hardening (CSV injection): any field beginning with = + - @
// or a control char is prefixed with a single quote so spreadsheet apps don't
// execute it. Also the standard quote/comma/newline escaping.
// ============================================================================
import { HEADERS, COLUMNS, SAMPLE_ROWS } from "./columns.js";

const FORMULA = /^[=+\-@\t\r]/;

/** Neutralise a leading formula trigger (used on both export and import). */
export function deFormula(value) {
  const s = value == null ? "" : String(value);
  return FORMULA.test(s) ? "'" + s : s;
}

export function csvField(value) {
  const s = deFormula(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers, rows) {
  const out = [headers.map(csvField).join(",")];
  for (const r of rows) out.push(r.map(csvField).join(","));
  return out.join("\r\n") + "\r\n";
}

/** sample-products.csv */
export function sampleTemplateCsv() {
  const keys = COLUMNS.map((c) => c.key);
  const rows = SAMPLE_ROWS.map((r) => keys.map((k) => r[k] ?? ""));
  return toCsv(HEADERS, rows);
}

/** failed-products.csv — Row, SKU, Reason (one line per failed/error row). */
export function errorReportCsv(batch) {
  const rows = (batch.rows || [])
    .filter((r) => r.status === "failed" || r.status === "error")
    .map((r) => [r.rowIndex, r.sku || r.data?.sku || "", r.reason || (r.issues || []).join("; ") || "Unknown error"]);
  return toCsv(["Row", "SKU", "Reason"], rows);
}
