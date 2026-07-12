"use client";
// Bulk Product Upload workflow: template/docs → drag-drop CSV/XLSX (+ Images ZIP)
// → server validate → editable preview → chunked publish with a progress bar →
// done. Products are created as "Pending Approval" (same admin flow as manual
// Add Product). Publishing runs 100 rows/request so 1000+ imports never freeze.
import { useState, useRef, useCallback, useEffect } from "react";
import { SectionCard, Badge } from "@/components/seller/ui";
import { inr } from "@/lib/seller/models";

const CHUNK = 100;
const STATUS_TONE = { valid: "green", warning: "amber", error: "red", success: "green", failed: "red", skipped: "gray", pending: "blue" };

function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
    xhr.onload = () => { try { resolve({ status: xhr.status, body: JSON.parse(xhr.responseText || "{}") }); } catch { reject(new Error("Unexpected server response")); } };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });
}

// Client-side lightweight re-check for edited rows (server re-validates on publish).
function localErrors(r) {
  const e = [];
  if (!String(r.name || "").trim()) e.push("Product Name is required");
  if (!String(r.sku || "").trim()) e.push("SKU is required");
  if (!String(r.category || "").trim()) e.push("Category is required");
  const price = Number(r.price), mrp = Number(r.mrp), stock = Number(r.stock), gst = Number(r.gst);
  if (!Number.isFinite(price) || price < 0) e.push("Invalid price");
  if (mrp > 0 && mrp < price) e.push("MRP is less than Price");
  if (Number.isFinite(stock) && stock < 0) e.push("Stock cannot be negative");
  if (Number.isFinite(gst) && (gst < 0 || gst > 28)) e.push("Invalid GST");
  return e;
}

function ProgressBar({ pct }) {
  return (
    <div className="w-full h-3 rounded-full bg-[#eef0f5] overflow-hidden">
      <div className="h-full bg-gradient-to-r from-[#3056D3] to-[#1E7A5A] transition-[width] duration-300" style={{ width: `${Math.round(pct)}%` }} />
    </div>
  );
}

export default function BulkUpload() {
  const [step, setStep] = useState("start"); // start | preview | publishing | done
  const [file, setFile] = useState(null);
  const [zip, setZip] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [phase, setPhase] = useState("");
  const [pct, setPct] = useState(0);

  const [batchId, setBatchId] = useState("");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [zipInfo, setZipInfo] = useState(null);
  const [notes, setNotes] = useState([]);
  const [edits, setEdits] = useState({}); // rowIndex → {field:val}
  const [removed, setRemoved] = useState({}); // rowIndex → true
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const zipRef = useRef(null);

  // Retry hand-off from the Import History page: jump straight to the preview.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("bulk:retry");
      if (!raw) return;
      sessionStorage.removeItem("bulk:retry");
      const d = JSON.parse(raw);
      if (d?.batchId && Array.isArray(d.rows)) { setBatchId(d.batchId); setRows(d.rows); setSummary(d.summary); setStep("preview"); }
    } catch { /* ignore */ }
  }, []);

  const merged = (r) => ({ ...r, ...(edits[r.rowIndex] || {}) });
  const rowErr = (r) => (edits[r.rowIndex] ? localErrors(merged(r)) : r.errors);
  const publishable = rows.filter((r) => !removed[r.rowIndex] && rowErr(r).length === 0);

  const reset = () => { setStep("start"); setFile(null); setZip(null); setRows([]); setSummary(null); setBatchId(""); setEdits({}); setRemoved({}); setResult(null); setErr(""); setPct(0); setNotes([]); setZipInfo(null); };

  const pickFile = (f) => {
    if (!f) return;
    const ok = /\.(csv|xlsx|xls|txt)$/i.test(f.name);
    if (!ok) return setErr("Please choose a CSV or XLSX file.");
    if (f.size > 20 * 1024 * 1024) return setErr("File exceeds the 20 MB limit.");
    setErr(""); setFile(f);
  };
  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files?.[0]; pickFile(f);
  }, []);

  async function validate() {
    if (!file) return setErr("Choose a file first.");
    setErr(""); setBusy(true); setPhase("Uploading file"); setPct(0);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (zip) fd.append("zip", zip);
      const { status, body } = await uploadWithProgress("/api/seller/bulk/validate", fd, (p) => { setPct(p * 90); setPhase(zip ? "Uploading file & images" : "Uploading file"); });
      setPct(95); setPhase("Validating");
      if (!body.ok) { setErr(body.error || `Validation failed (${status})`); setBusy(false); return; }
      setBatchId(body.batchId); setRows(body.rows || []); setSummary(body.summary); setZipInfo(body.zipInfo);
      const n = [];
      if (body.truncated) n.push("File was truncated to the first 10,000 rows.");
      if (body.unknownHeaders?.length) n.push(`Ignored unknown columns: ${body.unknownHeaders.join(", ")}`);
      if (body.zipInfo?.limitReached) n.push("Some ZIP images were skipped (storage limit) — use image URLs for large catalogues.");
      setNotes(n);
      setStep("preview");
    } catch (e) { setErr(e.message || "Upload failed."); }
    finally { setBusy(false); }
  }

  function editCell(rowIndex, field, value) {
    setEdits((prev) => ({ ...prev, [rowIndex]: { ...(prev[rowIndex] || {}), [field]: value } }));
  }

  async function publish() {
    const items = publishable.map((r) => ({ rowIndex: r.rowIndex, edits: edits[r.rowIndex] }));
    if (!items.length) return setErr("There are no valid rows to publish.");
    setErr(""); setStep("publishing"); setPct(0); setPhase("Creating products");
    let created = 0, failed = 0;
    try {
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        const finalize = i + CHUNK >= items.length;
        const res = await (await fetch("/api/seller/bulk/upload", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ batchId, items: chunk, finalize }),
        })).json();
        if (!res.ok) throw new Error(res.error || "Publish failed");
        created += res.created || 0; failed += res.failed || 0;
        setPct(Math.min(100, ((i + chunk.length) / items.length) * 100));
      }
      setResult({ created, failed, total: items.length });
      setStep("done");
    } catch (e) { setErr(e.message || "Publish failed."); setStep("preview"); }
  }

  const dl = (url) => { const a = document.createElement("a"); a.href = url; a.click(); };

  // ---------------- render ----------------
  if (step === "publishing") {
    return (
      <SectionCard title="Publishing your products">
        <div className="py-8 max-w-[520px] mx-auto text-center">
          <p className="text-[15px] font-bold text-[#0e1b4d] mb-1">{phase}…</p>
          <p className="text-[13px] text-[#6b7280] mb-5">Creating pending products in chunks of {CHUNK}. Please keep this tab open.</p>
          <ProgressBar pct={pct} />
          <p className="text-[13px] font-semibold text-[#3056D3] mt-3">{Math.round(pct)}%</p>
        </div>
      </SectionCard>
    );
  }

  if (step === "done") {
    return (
      <SectionCard title="Import complete">
        <div className="py-6 text-center max-w-[560px] mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#e6f4ee] text-[#1E7A5A] flex items-center justify-center mx-auto text-[30px]">✓</div>
          <h3 className="text-[18px] font-extrabold text-[#0e1b4d] mt-4">{result.created} product{result.created === 1 ? "" : "s"} submitted for approval</h3>
          <p className="text-[13px] text-[#6b7280] mt-1">They are now <b>Pending Approval</b> and go live once the Mediconeeds team approves them.{result.failed > 0 ? ` ${result.failed} row(s) failed.` : ""}</p>
          <div className="flex flex-wrap gap-2 justify-center mt-6">
            {result.failed > 0 && <a href={`/api/seller/bulk/errors/${batchId}`} className="h-[42px] leading-[42px] px-5 rounded-full border border-[#d23f3f] text-[#d23f3f] text-[13px] font-bold">Download error report</a>}
            <a href="/seller/products" className="h-[42px] leading-[42px] px-5 rounded-full bg-[#3056D3] text-white text-[13px] font-bold">View my products</a>
            <a href="/seller/products/bulk/history" className="h-[42px] leading-[42px] px-5 rounded-full border border-[#e2e5ee] text-[#374151] text-[13px] font-bold">Import history</a>
            <button onClick={reset} className="h-[42px] px-5 rounded-full border border-[#e2e5ee] text-[#374151] text-[13px] font-bold">Upload another file</button>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* resources */}
      <SectionCard title="1 · Get the template">
        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={() => dl("/api/seller/bulk/template")} className="h-[40px] px-4 rounded-full bg-[#3056D3] text-white text-[13px] font-bold">↓ Download sample template</button>
          <button onClick={() => dl("/api/seller/bulk/template?doc=instructions")} className="h-[40px] px-4 rounded-full border border-[#e2e5ee] text-[#374151] text-[13px] font-bold">↓ Download instructions</button>
          <span className="h-[40px] px-4 inline-flex items-center gap-2 rounded-full border border-dashed border-[#cbd5e1] text-[#9ca3af] text-[13px] font-semibold" title="Video guide coming soon">▷ Video guide (coming soon)</span>
        </div>
        <p className="text-[12.5px] text-[#6b7280] mt-3">Fill one product per row, keep the header row unchanged. Required: Product Name, SKU, Category, Price. Products are created as <b>Pending Approval</b> — never published directly.</p>
      </SectionCard>

      {/* upload */}
      {step === "start" && (
        <SectionCard title="2 · Upload your file">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-[14px] border-2 border-dashed p-8 text-center transition-colors ${dragOver ? "border-[#3056D3] bg-[#f5f8ff]" : "border-[#d5dae5] bg-[#fafbfe]"}`}
          >
            <div className="text-[34px]">📄</div>
            <p className="text-[14px] font-bold text-[#0e1b4d] mt-2">{file ? file.name : "Drag your CSV / XLSX here"}</p>
            <p className="text-[12.5px] text-[#6b7280] mt-1">{file ? `${(file.size / 1024).toFixed(0)} KB` : "or"}</p>
            {!file && <button onClick={() => fileRef.current?.click()} className="mt-3 h-[38px] px-4 rounded-full border border-[#3056D3] text-[#3056D3] text-[13px] font-bold">Choose file</button>}
            {file && <button onClick={() => setFile(null)} className="mt-3 text-[12.5px] text-[#d23f3f] font-semibold">Remove</button>}
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={(e) => pickFile(e.target.files?.[0])} />
          </div>

          <div className="mt-4 rounded-[12px] border border-[#eef0f5] p-4">
            <p className="text-[13px] font-bold text-[#0e1b4d] mb-1">Optional · Images ZIP</p>
            <p className="text-[12.5px] text-[#6b7280] mb-3">Upload a ZIP of images. We match them to rows by <b>SKU</b> (e.g. VC100.jpg) or by the filename you put in Image1–Image5.</p>
            <div className="flex items-center gap-2">
              <button onClick={() => zipRef.current?.click()} className="h-[36px] px-4 rounded-full border border-[#e2e5ee] text-[#374151] text-[12.5px] font-bold">{zip ? "Change ZIP" : "Choose ZIP"}</button>
              {zip && <span className="text-[12.5px] text-[#374151]">{zip.name} ({(zip.size / 1048576).toFixed(1)} MB) <button onClick={() => setZip(null)} className="text-[#d23f3f] font-semibold ml-1">×</button></span>}
              <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={(e) => { const z = e.target.files?.[0]; if (z && z.size > 500 * 1048576) return setErr("ZIP exceeds 500 MB."); setZip(z || null); }} />
            </div>
          </div>

          {err && <p className="text-[13px] text-[#d23f3f] font-semibold mt-3">{err}</p>}

          {busy ? (
            <div className="mt-4"><p className="text-[13px] font-semibold text-[#0e1b4d] mb-2">{phase}…</p><ProgressBar pct={pct} /></div>
          ) : (
            <button onClick={validate} disabled={!file} className="mt-4 h-[46px] px-6 rounded-full bg-[#1E7A5A] text-white text-[14px] font-bold disabled:opacity-50">Validate &amp; preview →</button>
          )}
        </SectionCard>
      )}

      {/* preview */}
      {step === "preview" && summary && (
        <SectionCard
          title="3 · Preview & publish"
          action={<button onClick={reset} className="text-[12.5px] font-semibold text-[#6b7280]">Start over</button>}
        >
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge tone="blue">{summary.total} rows</Badge>
            <Badge tone="green">{summary.valid} valid</Badge>
            <Badge tone="amber">{summary.warnings} warnings</Badge>
            <Badge tone="red">{summary.errors} errors</Badge>
            {zipInfo?.used && <Badge tone="indigo">{zipInfo.matched} images matched</Badge>}
          </div>
          {notes.map((n, i) => <p key={i} className="text-[12.5px] text-[#b7791f] mb-1">⚠ {n}</p>)}
          {err && <p className="text-[13px] text-[#d23f3f] font-semibold mb-2">{err}</p>}

          <div className="overflow-x-auto mc-rtable-wrap border border-[#eef0f5] rounded-[12px]">
            <table className="w-full text-[12.5px] min-w-[900px]">
              <thead>
                <tr className="text-[#6b7280] text-left bg-[#fafbfe] border-b border-[#eef0f5]">
                  <th className="p-2.5 font-semibold">Image</th><th className="p-2.5 font-semibold">Product</th><th className="p-2.5 font-semibold">SKU</th>
                  <th className="p-2.5 font-semibold">Category</th><th className="p-2.5 font-semibold">Price</th><th className="p-2.5 font-semibold">MRP</th>
                  <th className="p-2.5 font-semibold">Stock</th><th className="p-2.5 font-semibold">Validation</th><th className="p-2.5 font-semibold text-right">Row</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r0) => {
                  const r = merged(r0);
                  const errs = rowErr(r0);
                  const st = removed[r0.rowIndex] ? "skipped" : errs.length ? "error" : (r0.warnings.length ? "warning" : "valid");
                  return (
                    <tr key={r0.rowIndex} className={`border-b border-[#f5f6fa] last:border-0 ${removed[r0.rowIndex] ? "opacity-40" : ""}`}>
                      <td className="p-2">
                        {r.imageSource === "url" && r.imageThumb ? <img src={r.imageThumb} alt="" className="w-10 h-10 rounded object-cover bg-[#eef0f5]" />
                          : r.imageSource === "zip" ? <span className="w-10 h-10 rounded bg-[#eef2ff] text-[#3056D3] text-[9px] font-bold flex items-center justify-center">ZIP</span>
                            : <span className="w-10 h-10 rounded bg-[#f5f6fa] text-[#9ca3af] text-[9px] flex items-center justify-center">none</span>}
                      </td>
                      <td className="p-2"><input value={r.name} onChange={(e) => editCell(r0.rowIndex, "name", e.target.value)} className="w-[150px] bg-transparent border border-transparent hover:border-[#e2e5ee] focus:border-[#3056D3] rounded px-1.5 py-1 outline-none font-semibold text-[#0e1b4d]" /></td>
                      <td className="p-2"><input value={r.sku} onChange={(e) => editCell(r0.rowIndex, "sku", e.target.value)} className="w-[80px] bg-transparent border border-transparent hover:border-[#e2e5ee] focus:border-[#3056D3] rounded px-1.5 py-1 outline-none" /></td>
                      <td className="p-2"><input value={r.category} onChange={(e) => editCell(r0.rowIndex, "category", e.target.value)} className="w-[100px] bg-transparent border border-transparent hover:border-[#e2e5ee] focus:border-[#3056D3] rounded px-1.5 py-1 outline-none" /></td>
                      <td className="p-2"><input value={r.price} onChange={(e) => editCell(r0.rowIndex, "price", e.target.value)} className="w-[70px] bg-transparent border border-transparent hover:border-[#e2e5ee] focus:border-[#3056D3] rounded px-1.5 py-1 outline-none" /></td>
                      <td className="p-2"><input value={r.mrp} onChange={(e) => editCell(r0.rowIndex, "mrp", e.target.value)} className="w-[70px] bg-transparent border border-transparent hover:border-[#e2e5ee] focus:border-[#3056D3] rounded px-1.5 py-1 outline-none" /></td>
                      <td className="p-2"><input value={r.stock} onChange={(e) => editCell(r0.rowIndex, "stock", e.target.value)} className="w-[60px] bg-transparent border border-transparent hover:border-[#e2e5ee] focus:border-[#3056D3] rounded px-1.5 py-1 outline-none" /></td>
                      <td className="p-2">
                        <Badge tone={STATUS_TONE[st]}>{st}</Badge>
                        {errs.length > 0 && <div className="text-[11px] text-[#d23f3f] mt-1">{errs.join("; ")}</div>}
                        {st === "warning" && r0.warnings.length > 0 && <div className="text-[11px] text-[#b7791f] mt-1">{r0.warnings.join("; ")}</div>}
                      </td>
                      <td className="p-2 text-right whitespace-nowrap">
                        {removed[r0.rowIndex]
                          ? <button onClick={() => setRemoved((x) => { const n = { ...x }; delete n[r0.rowIndex]; return n; })} className="text-[12px] font-semibold text-[#1E7A5A]">Restore</button>
                          : <button onClick={() => setRemoved((x) => ({ ...x, [r0.rowIndex]: true }))} className="text-[12px] font-semibold text-[#d23f3f]">Remove</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
            <p className="text-[13px] text-[#374151]"><b>{publishable.length}</b> product{publishable.length === 1 ? "" : "s"} ready to publish{rows.length - publishable.length > 0 ? ` · ${rows.length - publishable.length} excluded (errors/removed)` : ""}</p>
            <button onClick={publish} disabled={!publishable.length} className="h-[46px] px-7 rounded-full bg-[#1E7A5A] text-white text-[14px] font-bold disabled:opacity-50">Publish {publishable.length} as Pending →</button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
