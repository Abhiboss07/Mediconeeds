// ============================================================================
// Minimal, dependency-free PDF writer. Enough to lay out professional invoices
// and reports: text (Helvetica / Helvetica-Bold, sizes, RGB colour), filled
// rectangles and lines, with multi-page support. Uses only the two built-in
// (non-embedded) standard fonts, so output is tiny and needs no font files.
//
// NOTE: the standard fonts use WinAnsi encoding, which has no rupee glyph (₹).
// Callers must render money as "Rs. 1,234" — helper `rupee()` below does this.
// ============================================================================

const A4 = { w: 595.28, h: 841.89 };

const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
// Strip anything outside the safe WinAnsi printable range so a stray unicode
// character can never corrupt the stream.
const ascii = (s) =>
  String(s)
    .replace(/₹/g, "Rs. ")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E]/g, "");

export function rupee(n) {
  return "Rs. " + Number(n || 0).toLocaleString("en-IN");
}

export class Pdf {
  constructor({ size = A4, margin = 48 } = {}) {
    this.size = size;
    this.margin = margin;
    this.pages = [];
    this.newPage();
  }

  newPage() {
    this.ops = [];
    this.pages.push(this.ops);
    this.y = this.margin; // cursor measured from the TOP of the page, increasing downward
    return this;
  }

  get pageWidth() { return this.size.w; }
  get contentWidth() { return this.size.w - this.margin * 2; }

  // All public methods take y as a distance from the TOP of the page (increasing
  // downward, the natural layout direction); PDF itself is bottom-origin, so we
  // convert here in one place.
  _fromTop(yTop) { return this.size.h - yTop; }

  _color(r, g, b, stroke = false) {
    this.ops.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} ${stroke ? "RG" : "rg"}`);
  }

  // colour is [r,g,b] 0..1; yTop is the text baseline distance from the top.
  text(x, yTop, str, { size = 10, bold = false, color = [0.05, 0.09, 0.2] } = {}) {
    const font = bold ? "F2" : "F1";
    this._color(color[0], color[1], color[2]);
    this.ops.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${this._fromTop(yTop).toFixed(2)} Td (${esc(ascii(str))}) Tj ET`);
    return this;
  }

  // Right-align text so its right edge sits at xRight.
  textRight(xRight, yTop, str, opts = {}) {
    const w = this.textWidth(str, opts.size || 10, opts.bold);
    this.text(xRight - w, yTop, str, opts);
    return this;
  }

  // Approx width using Helvetica metrics (average) — good enough for alignment.
  textWidth(str, size = 10, bold = false) {
    const s = ascii(str);
    // Per-char widths in 1000-unit em (Helvetica), simplified buckets.
    let units = 0;
    for (const ch of s) {
      if (/[iIl.,:;'|!]/.test(ch)) units += 278;
      else if (/[fjtr ]/.test(ch)) units += 320;
      else if (/[mwMW]/.test(ch)) units += 830;
      else if (/[A-Z0-9]/.test(ch)) units += 640;
      else units += 528;
    }
    if (bold) units *= 1.04;
    return (units / 1000) * size;
  }

  line(x1, yTop1, x2, yTop2, { color = [0.85, 0.86, 0.9], width = 0.8 } = {}) {
    this._color(color[0], color[1], color[2], true);
    this.ops.push(`${width} w ${x1.toFixed(2)} ${this._fromTop(yTop1).toFixed(2)} m ${x2.toFixed(2)} ${this._fromTop(yTop2).toFixed(2)} l S`);
    return this;
  }

  rect(x, yTop, w, h, { color = [0.95, 0.96, 0.98] } = {}) {
    // yTop is the TOP edge (from page top). PDF rect origin is bottom-left.
    this._color(color[0], color[1], color[2]);
    this.ops.push(`${x.toFixed(2)} ${this._fromTop(yTop + h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
    return this;
  }

  moveDown(dy) { this.y += dy; return this; }

  // Assemble the final PDF buffer.
  build() {
    const objects = [];
    const add = (body) => { objects.push(body); return objects.length; }; // returns 1-based obj number

    // Reserve: 1=Catalog, 2=Pages. Page + content objects appended after.
    const catalogNo = 1;
    const pagesNo = 2;
    objects.push(""); // slot 1 (filled later)
    objects.push(""); // slot 2 (filled later)

    const fontRegularNo = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    const fontBoldNo = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

    const pageNos = [];
    for (const ops of this.pages) {
      const stream = ops.join("\n");
      const contentNo = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
      const pageNo = add(
        `<< /Type /Page /Parent ${pagesNo} 0 R /MediaBox [0 0 ${this.size.w} ${this.size.h}] ` +
        `/Resources << /Font << /F1 ${fontRegularNo} 0 R /F2 ${fontBoldNo} 0 R >> >> ` +
        `/Contents ${contentNo} 0 R >>`
      );
      pageNos.push(pageNo);
    }

    objects[catalogNo - 1] = `<< /Type /Catalog /Pages ${pagesNo} 0 R >>`;
    objects[pagesNo - 1] =
      `<< /Type /Pages /Kids [${pageNos.map((n) => `${n} 0 R`).join(" ")}] /Count ${pageNos.length} >>`;

    // Serialise with xref.
    let out = "%PDF-1.4\n%\xFF\xFF\xFF\xFF\n";
    const offsets = [];
    objects.forEach((body, i) => {
      offsets[i] = Buffer.byteLength(out, "latin1");
      out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xrefStart = Buffer.byteLength(out, "latin1");
    out += `xref\n0 ${objects.length + 1}\n`;
    out += "0000000000 65535 f \n";
    for (const off of offsets) out += String(off).padStart(10, "0") + " 00000 n \n";
    out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogNo} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return Buffer.from(out, "latin1");
  }
}
