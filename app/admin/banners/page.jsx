"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { SectionCard, Badge } from "@/components/seller/ui";

const EMPTY = { title: "", type: "hero", desktopImage: "", mobileImage: "", link: "", priority: 0, startDate: "", endDate: "", active: true };
const TYPES = ["hero", "slider", "offer", "homepage"];
const STATUS_TONE = { live: "green", scheduled: "blue", expired: "amber", disabled: "gray" };

function Field({ label, children }) {
  return <label className="block"><span className="block text-[12.5px] font-semibold text-[#0e1b4d] mb-1">{label}</span>{children}</label>;
}
const input = "w-full h-[40px] px-3 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[13.5px] outline-none focus:border-[#3056D3] bg-white";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try { const r = await (await fetch("/api/admin/banners", { cache: "no-store" })).json(); if (r.ok) setRows(r.banners); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.title || form.title.trim().length < 2) { setErr("Title is required (min 2 chars)."); return; }
    setSaving(true); setErr("");
    try {
      const editing = Boolean(form.id);
      const payload = { ...form, startDate: form.startDate || null, endDate: form.endDate || null };
      const url = editing ? `/api/admin/banners/${form.id}` : "/api/admin/banners";
      const r = await (await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, cache: "no-store", body: JSON.stringify(payload) })).json();
      if (!r.ok) { setErr(r.errors ? Object.values(r.errors).flat().join(", ") : r.error || "Could not save"); return; }
      setForm(null); await load();
    } finally { setSaving(false); }
  }
  async function toggle(b) { await fetch(`/api/admin/banners/${b.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, cache: "no-store", body: JSON.stringify({ active: !b.active }) }); await load(); }
  async function del(b) { if (!confirm(`Delete banner "${b.title}"?`)) return; await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE", cache: "no-store" }); await load(); }

  const actions = <button onClick={() => { setErr(""); setForm({ ...EMPTY }); }} className="h-[36px] px-4 rounded-full bg-[#3056D3] text-white text-[13px] font-bold">+ Add banner</button>;

  return (
    <AdminShell active="/admin/banners" title="Banners" subtitle="Hero, slider & offer banners" actions={actions}>
      {form && (
        <div className="rounded-[16px] border border-[rgba(48,86,211,0.25)] bg-white p-5 mb-4">
          <h3 className="text-[15px] font-bold text-[#0e1b4d] mb-3">{form.id ? "Edit banner" : "New banner"}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Title *"><input className={input} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Monsoon sale hero" /></Field>
            <Field label="Type"><select className={input} value={form.type} onChange={(e) => set("type", e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
            <Field label="Desktop image URL"><input className={input} value={form.desktopImage} onChange={(e) => set("desktopImage", e.target.value)} placeholder="/banners/hero-desktop.jpg" /></Field>
            <Field label="Mobile image URL"><input className={input} value={form.mobileImage} onChange={(e) => set("mobileImage", e.target.value)} placeholder="/banners/hero-mobile.jpg" /></Field>
            <Field label="Link URL"><input className={input} value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="/offers" /></Field>
            <Field label="Priority (lower shows first)"><input type="number" className={input} value={form.priority} onChange={(e) => set("priority", e.target.value)} /></Field>
            <Field label="Start date"><input type="date" className={input} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            <Field label="End date"><input type="date" className={input} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2 mt-3 text-[13px] font-semibold text-[#0e1b4d]"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="w-[15px] h-[15px] accent-[#3056D3]" /> Active</label>
          {err && <p className="text-[12.5px] text-[#d23f3f] mt-2">{err}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={save} disabled={saving} className="h-[38px] px-5 rounded-full bg-[#3056D3] text-white text-[13px] font-bold disabled:opacity-60">{saving ? "Saving…" : "Save banner"}</button>
            <button onClick={() => setForm(null)} className="h-[38px] px-5 rounded-full border border-[rgba(111,115,132,0.4)] text-[#0e1b4d] text-[13px] font-bold">Cancel</button>
          </div>
        </div>
      )}

      <SectionCard title={`Banners (${rows.length})`}>
        {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : rows.length === 0 ? (
          <p className="text-[13px] text-[#6b7280]">No banners yet. Click “Add banner” to create one.</p>
        ) : (
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[820px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Banner</th><th className="pb-2 font-semibold">Type</th><th className="pb-2 font-semibold">Priority</th><th className="pb-2 font-semibold">Schedule</th><th className="pb-2 font-semibold">Status</th><th className="pb-2 font-semibold text-right">Actions</th></tr></thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5" data-label="Banner"><div className="flex items-center gap-2.5">{b.desktopImage ? <img src={b.desktopImage} alt="" className="w-14 h-8 rounded-[6px] object-cover border border-[#eef0f5] bg-white shrink-0" /> : <span className="w-14 h-8 rounded-[6px] bg-[#eef2ff] shrink-0" />}<span className="font-semibold text-[#0e1b4d] max-w-[220px] truncate">{b.title}</span></div></td>
                    <td className="py-2.5 text-[#6b7280] capitalize" data-label="Type">{b.type}</td>
                    <td className="py-2.5 text-[#374151]" data-label="Priority">{b.priority}</td>
                    <td className="py-2.5 text-[#6b7280]" data-label="Schedule">{b.startDate || "—"} → {b.endDate || "—"}</td>
                    <td className="py-2.5" data-label="Status"><Badge tone={STATUS_TONE[b.status] || "gray"}>{b.status}</Badge></td>
                    <td className="py-2.5" data-label="Actions"><div className="flex items-center justify-end gap-3">
                      <button onClick={() => toggle(b)} className="text-[12px] font-semibold text-[#3056D3]">{b.active ? "Disable" : "Enable"}</button>
                      <button onClick={() => { setErr(""); setForm({ ...b }); }} className="text-[12px] font-semibold text-[#0e1b4d]">Edit</button>
                      <button onClick={() => del(b)} className="text-[12px] font-semibold text-[#d23f3f]">Delete</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </AdminShell>
  );
}
