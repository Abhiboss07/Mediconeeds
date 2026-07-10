"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { SectionCard, Badge } from "@/components/seller/ui";

const EMPTY = { name: "", slug: "", image: "", seoTitle: "", seoDescription: "", displayOrder: 0, active: true };

function Field({ label, children }) {
  return <label className="block"><span className="block text-[12.5px] font-semibold text-[#0e1b4d] mb-1">{label}</span>{children}</label>;
}
const input = "w-full h-[40px] px-3 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[13.5px] outline-none focus:border-[#3056D3] bg-white";

export default function Page() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null); // null = closed; {} = add; {id,...} = edit
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await (await fetch("/api/admin/categories?q=" + encodeURIComponent(q), { cache: "no-store" })).json();
      if (r.ok) setRows(r.categories);
    } finally { setLoading(false); }
  }
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name || form.name.trim().length < 2) { setErr("Name is required (min 2 chars)."); return; }
    setSaving(true); setErr("");
    try {
      const editing = Boolean(form.id);
      const url = editing ? `/api/admin/categories/${form.id}` : "/api/admin/categories";
      const r = await (await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, cache: "no-store", body: JSON.stringify(form) })).json();
      if (!r.ok) { setErr(r.errors ? Object.values(r.errors).flat().join(", ") : r.error || "Could not save"); return; }
      setForm(null); await load();
    } finally { setSaving(false); }
  }
  async function toggle(c) {
    await fetch(`/api/admin/categories/${c.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, cache: "no-store", body: JSON.stringify({ active: !c.active }) });
    await load();
  }
  async function del(c) {
    if (!confirm(`Delete category "${c.name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/categories/${c.id}`, { method: "DELETE", cache: "no-store" });
    await load();
  }

  const actions = <button onClick={() => { setErr(""); setForm({ ...EMPTY }); }} className="h-[36px] px-4 rounded-full bg-[#3056D3] text-white text-[13px] font-bold">+ Add category</button>;

  return (
    <AdminShell active="/admin/categories" title="Categories" subtitle="Manage storefront categories" actions={actions}>
      <div className="relative mb-4 max-w-[360px]">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories…" className="w-full h-[40px] pl-9 pr-4 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[13.5px] outline-none focus:border-[#3056D3] bg-white" />
      </div>

      {form && (
        <div className="rounded-[16px] border border-[rgba(48,86,211,0.25)] bg-white p-5 mb-4">
          <h3 className="text-[15px] font-bold text-[#0e1b4d] mb-3">{form.id ? "Edit category" : "New category"}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name *"><input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Serums" /></Field>
            <Field label="Slug (auto if blank)"><input className={input} value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="serums" /></Field>
            <Field label="Image URL"><input className={input} value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="/catalog/cat-serum.svg" /></Field>
            <Field label="Display order"><input type="number" className={input} value={form.displayOrder} onChange={(e) => set("displayOrder", e.target.value)} /></Field>
            <Field label="SEO title"><input className={input} value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} /></Field>
            <Field label="SEO description"><input className={input} value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-2 mt-3 text-[13px] font-semibold text-[#0e1b4d]"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="w-[15px] h-[15px] accent-[#3056D3]" /> Active (visible on storefront)</label>
          {err && <p className="text-[12.5px] text-[#d23f3f] mt-2">{err}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={save} disabled={saving} className="h-[38px] px-5 rounded-full bg-[#3056D3] text-white text-[13px] font-bold disabled:opacity-60">{saving ? "Saving…" : "Save category"}</button>
            <button onClick={() => setForm(null)} className="h-[38px] px-5 rounded-full border border-[rgba(111,115,132,0.4)] text-[#0e1b4d] text-[13px] font-bold">Cancel</button>
          </div>
        </div>
      )}

      <SectionCard title={`Categories (${rows.length})`}>
        {loading ? <p className="text-[13px] text-[#6b7280]">Loading…</p> : rows.length === 0 ? (
          <p className="text-[13px] text-[#6b7280]">No categories yet. Click “Add category” to create one.</p>
        ) : (
          <div className="overflow-x-auto mc-rtable-wrap">
            <table className="w-full text-[13px] mc-rtable min-w-[760px]">
              <thead><tr className="text-[#6b7280] text-left border-b border-[#eef0f5]"><th className="pb-2 font-semibold">Category</th><th className="pb-2 font-semibold">Slug</th><th className="pb-2 font-semibold">Order</th><th className="pb-2 font-semibold">Products</th><th className="pb-2 font-semibold">Status</th><th className="pb-2 font-semibold text-right">Actions</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-[#f5f6fa] last:border-0">
                    <td className="py-2.5" data-label="Category"><div className="flex items-center gap-2.5">{c.image ? <img src={c.image} alt="" className="w-8 h-8 rounded-[8px] object-contain border border-[#eef0f5] bg-white shrink-0" /> : <span className="w-8 h-8 rounded-[8px] bg-[#eef2ff] text-[#3056D3] flex items-center justify-center font-bold shrink-0">{c.name[0]}</span>}<span className="font-semibold text-[#0e1b4d]">{c.name}</span></div></td>
                    <td className="py-2.5 text-[#6b7280]" data-label="Slug">{c.slug}</td>
                    <td className="py-2.5 text-[#374151]" data-label="Order">{c.displayOrder}</td>
                    <td className="py-2.5 font-semibold text-[#0e1b4d]" data-label="Products">{c.productCount}</td>
                    <td className="py-2.5" data-label="Status"><Badge tone={c.active ? "green" : "gray"}>{c.active ? "Active" : "Disabled"}</Badge></td>
                    <td className="py-2.5" data-label="Actions"><div className="flex items-center justify-end gap-3">
                      <button onClick={() => toggle(c)} className="text-[12px] font-semibold text-[#3056D3]">{c.active ? "Disable" : "Enable"}</button>
                      <button onClick={() => { setErr(""); setForm({ ...c }); }} className="text-[12px] font-semibold text-[#0e1b4d]">Edit</button>
                      <button onClick={() => del(c)} className="text-[12px] font-semibold text-[#d23f3f]">Delete</button>
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
