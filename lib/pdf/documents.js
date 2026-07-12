// ============================================================================
// PDF document builders for the seller wallet: a per-settlement tax invoice and
// a consolidated GST settlement report. Both return a Buffer (application/pdf).
// Rendered with the dependency-free writer in ./pdf.js.
// ============================================================================
import { Pdf, rupee } from "./pdf.js";

const BRAND = [0.188, 0.337, 0.827]; // #3056D3
const INK = [0.055, 0.106, 0.302]; // #0e1b4d
const MUTE = [0.42, 0.45, 0.5];
const RED = [0.824, 0.247, 0.247];
const GREEN = [0.118, 0.478, 0.353];

function fmtDate(d) {
  if (!d) return "-";
  const x = new Date(d);
  if (isNaN(x)) return "-";
  return x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// "Medico" (ink) + "needs" (brand) wordmark at top-left.
function wordmark(pdf, x, yTop, size = 20) {
  pdf.text(x, yTop, "Medico", { size, bold: true, color: INK });
  const w = pdf.textWidth("Medico", size, true);
  pdf.text(x + w, yTop, "needs", { size, bold: true, color: BRAND });
}

function statusColor(status) {
  if (status === "paid") return GREEN;
  if (status === "rejected") return RED;
  return [0.717, 0.475, 0.122]; // amber
}

// ---------------------------------------------------------------------------
// Single settlement invoice
// ---------------------------------------------------------------------------
export function settlementInvoice(s) {
  const pdf = new Pdf({ margin: 48 });
  const L = 48;
  const R = pdf.pageWidth - 48;
  let y = 54;

  // Letterhead
  wordmark(pdf, L, y, 22);
  pdf.textRight(R, y + 2, "TAX INVOICE", { size: 13, bold: true, color: INK });
  pdf.textRight(R, y + 20, "Settlement / Payout", { size: 9, color: MUTE });
  y += 40;
  pdf.line(L, y, R, y, { color: BRAND, width: 1.4 });
  y += 24;

  // Two columns: seller (from) / buyer (bill to)
  const seller = s.seller || {};
  const buyer = s.buyer || {};
  pdf.text(L, y, "SETTLED TO (SELLER)", { size: 8, bold: true, color: MUTE });
  pdf.text(R - 210, y, "PLATFORM", { size: 8, bold: true, color: MUTE });
  y += 15;
  pdf.text(L, y, seller.company || "-", { size: 11, bold: true, color: INK });
  pdf.text(R - 210, y, "Mediconeeds Marketplace", { size: 11, bold: true, color: INK });
  y += 14;
  const sellerLines = [
    seller.owner ? "Attn: " + seller.owner : "",
    seller.address || "",
    seller.gst ? "GSTIN: " + seller.gst : "",
    seller.email || "",
  ].filter(Boolean);
  const platLines = ["Dr Awish Healthcare / Mediconeeds", "GSTIN: 07AABCM1234C1Z5", "billing@mediconeeds.com"];
  const rows = Math.max(sellerLines.length, platLines.length);
  for (let i = 0; i < rows; i++) {
    if (sellerLines[i]) pdf.text(L, y, sellerLines[i], { size: 9, color: MUTE });
    if (platLines[i]) pdf.text(R - 210, y, platLines[i], { size: 9, color: MUTE });
    y += 13;
  }
  y += 12;

  // Meta strip
  pdf.rect(L, y + 4, R - L, 58, { color: [0.96, 0.97, 0.99] });
  const metaY = y + 18;
  const col = (R - L) / 3;
  const meta = [
    ["Settlement No.", s.settlementNo || "-"],
    ["Invoice No.", s.invoiceNo || "-"],
    ["Settlement Date", fmtDate(s.date)],
    ["Period", s.periodLabel || "-"],
    ["Transaction Ref.", s.txnRef || "-"],
    ["Payment Status", (s.status || "processing").toUpperCase()],
  ];
  meta.forEach(([k, v], i) => {
    const cx = L + 14 + (i % 3) * col;
    const cy = metaY + Math.floor(i / 3) * 26;
    pdf.text(cx, cy, k, { size: 7.5, bold: true, color: MUTE });
    pdf.text(cx, cy + 11, v, { size: 10, bold: true, color: i === 5 ? statusColor(s.status) : INK });
  });
  y += 78;

  // Amounts table
  pdf.text(L, y, "DESCRIPTION", { size: 8, bold: true, color: MUTE });
  pdf.textRight(R, y, "AMOUNT", { size: 8, bold: true, color: MUTE });
  y += 8;
  pdf.line(L, y, R, y, { color: [0.8, 0.82, 0.88], width: 1 });
  y += 18;

  const line = (label, value, opts = {}) => {
    pdf.text(L, y, label, { size: 10, color: opts.color || INK, bold: opts.bold });
    pdf.textRight(R, y, value, { size: 10, color: opts.color || INK, bold: opts.bold });
    y += 20;
  };
  line(`Gross sales (${s.orderCount || 0} orders)`, rupee(s.gross));
  line(`Platform commission (${s.commissionRate || 0}%)`, "- " + rupee(s.commission), { color: RED });
  line(`GST on commission (${s.gstRate || 18}%)`, "- " + rupee(s.gstOnCommission), { color: RED });
  y += 2;
  pdf.line(L, y, R, y, { color: [0.8, 0.82, 0.88], width: 1 });
  y += 20;
  line("Net payable to seller", rupee(s.net), { bold: true });

  // Footer
  let fy = 96;
  pdf.line(L, pdf.size.h - fy - 12, R, pdf.size.h - fy - 12, { color: [0.9, 0.91, 0.94] });
  pdf.text(L, pdf.size.h - fy, "This is a system-generated settlement invoice and does not require a signature.", { size: 8, color: MUTE });
  pdf.text(L, pdf.size.h - fy + 13, "Mediconeeds Marketplace — a Dr Awish Healthcare venture.", { size: 8, color: MUTE });

  return pdf.build();
}

// ---------------------------------------------------------------------------
// Consolidated GST settlement report (multi-row, paginated)
// ---------------------------------------------------------------------------
export function gstReport(r) {
  const pdf = new Pdf({ margin: 36 });
  const L = 36;
  const R = pdf.pageWidth - 36;
  const rows = r.rows || [];
  const seller = r.seller || {};

  // Column x anchors
  const cx = { stl: L, inv: 118, date: 205, gross: 320, comm: 392, gst: 452, net: R };

  const header = () => {
    let y = 44;
    wordmark(pdf, L, y, 18);
    pdf.textRight(R, y, "GST SETTLEMENT REPORT", { size: 12, bold: true, color: INK });
    pdf.textRight(R, y + 15, "Generated " + fmtDate(r.generatedAt || new Date()), { size: 8, color: MUTE });
    y += 30;
    pdf.line(L, y, R, y, { color: BRAND, width: 1.2 });
    y += 16;
    pdf.text(L, y, seller.company || "-", { size: 11, bold: true, color: INK });
    pdf.textRight(R, y, r.periodLabel || "All settlements", { size: 9, color: MUTE });
    y += 13;
    pdf.text(L, y, "GSTIN: " + (seller.gst || "Not provided") + (seller.email ? "   ·   " + seller.email : ""), { size: 9, color: MUTE });
    y += 20;
    // table head
    pdf.rect(L, y + 4, R - L, 18, { color: [0.93, 0.95, 0.99] });
    const hy = y + 16;
    pdf.text(cx.stl, hy, "Settlement", { size: 8, bold: true, color: INK });
    pdf.text(cx.inv, hy, "Invoice", { size: 8, bold: true, color: INK });
    pdf.text(cx.date, hy, "Date", { size: 8, bold: true, color: INK });
    pdf.textRight(cx.gross, hy, "Gross", { size: 8, bold: true, color: INK });
    pdf.textRight(cx.comm, hy, "Commission", { size: 8, bold: true, color: INK });
    pdf.textRight(cx.gst, hy, "GST", { size: 8, bold: true, color: INK });
    pdf.textRight(cx.net, hy, "Net", { size: 8, bold: true, color: INK });
    return y + 26;
  };

  let y = header();
  const rowH = 16;
  const bottom = 96;

  const totals = { gross: 0, comm: 0, gst: 0, net: 0 };
  for (const row of rows) {
    if (y > pdf.size.h - bottom) { pdf.newPage(); y = header(); }
    pdf.text(cx.stl, y, row.settlementNo || "-", { size: 8.5, color: INK });
    pdf.text(cx.inv, y, row.invoiceNo || "-", { size: 8, color: MUTE });
    pdf.text(cx.date, y, fmtDate(row.date), { size: 8.5, color: MUTE });
    pdf.textRight(cx.gross, y, rupee(row.gross), { size: 8.5, color: INK });
    pdf.textRight(cx.comm, y, rupee(row.commission), { size: 8.5, color: RED });
    pdf.textRight(cx.gst, y, rupee(row.gstOnCommission), { size: 8.5, color: RED });
    pdf.textRight(cx.net, y, rupee(row.net), { size: 8.5, bold: true, color: INK });
    totals.gross += row.gross || 0;
    totals.comm += row.commission || 0;
    totals.gst += row.gstOnCommission || 0;
    totals.net += row.net || 0;
    y += rowH;
    pdf.line(L, y - 5, R, y - 5, { color: [0.93, 0.94, 0.96], width: 0.5 });
  }

  if (!rows.length) {
    pdf.text(L, y + 6, "No settlements found for this seller yet.", { size: 10, color: MUTE });
    y += 24;
  }

  // Totals
  y += 6;
  pdf.line(L, y, R, y, { color: [0.8, 0.82, 0.88], width: 1 });
  y += 16;
  pdf.text(cx.stl, y, "TOTALS (" + rows.length + " settlements)", { size: 9, bold: true, color: INK });
  pdf.textRight(cx.gross, y, rupee(totals.gross), { size: 9, bold: true, color: INK });
  pdf.textRight(cx.comm, y, rupee(totals.comm), { size: 9, bold: true, color: RED });
  pdf.textRight(cx.gst, y, rupee(totals.gst), { size: 9, bold: true, color: RED });
  pdf.textRight(cx.net, y, rupee(totals.net), { size: 9, bold: true, color: GREEN });

  // Footer
  pdf.text(L, pdf.size.h - 60, "This report summarises platform commission and GST charged on your settlements. For statutory filing, reconcile with your books.", { size: 8, color: MUTE });
  pdf.text(L, pdf.size.h - 47, "Mediconeeds Marketplace — a Dr Awish Healthcare venture.", { size: 8, color: MUTE });

  return pdf.build();
}
