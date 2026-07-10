"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { SectionCard } from "@/components/seller/ui";

const input = "h-[38px] px-3 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[13.5px] outline-none focus:border-[#3056D3] bg-white";
const pctBox = "w-[90px] " + input;

export default function Page() {
  const [c, setC] = useState(null);
  const [cats, setCats] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [cm, ct, sl] = await Promise.all([
          fetch("/api/admin/commission", { cache: "no-store" }).then((r) => r.json()),
          fetch("/api/admin/categories", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ categories: [] })),
          fetch("/api/admin/sellers", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ active: [], pending: [] })),
        ]);
        if (cm.ok) setC(cm.commission);
        setCats((ct.categories || []).map((x) => ({ slug: x.slug, name: x.name })));
        setSellers([...(sl.active || []), ...(sl.pending || [])].map((s) => ({ id: s.id, company: s.company || s.owner || "Seller" })));
      } finally { setLoading(false); }
    })();
  }, []);

  const setField = (k, v) => setC((p) => ({ ...p, [k]: v === "" ? "" : Number(v) }));
  const addCatRate = () => { const avail = cats.find((x) => !c.categoryRates.some((r) => r.category === x.slug)); if (avail) setC((p) => ({ ...p, categoryRates: [...p.categoryRates, { category: avail.slug, rate: p.global }] })); };
  const setCatRate = (i, k, v) => setC((p) => { const arr = [...p.categoryRates]; arr[i] = { ...arr[i], [k]: k === "rate" ? Number(v) : v }; return { ...p, categoryRates: arr }; });
  const rmCatRate = (i) => setC((p) => ({ ...p, categoryRates: p.categoryRates.filter((_, x) => x !== i) }));
  const addOverride = () => { const avail = sellers.find((s) => !c.sellerOverrides.some((o) => o.sellerId === s.id)); if (avail) setC((p) => ({ ...p, sellerOverrides: [...p.sellerOverrides, { sellerId: avail.id, sellerName: avail.company, rate: p.global }] })); };
  const setOverride = (i, k, v) => setC((p) => { const arr = [...p.sellerOverrides]; if (k === "sellerId") { const s = sellers.find((x) => x.id === v); arr[i] = { ...arr[i], sellerId: v, sellerName: s?.company || "" }; } else arr[i] = { ...arr[i], [k]: Number(v) }; return { ...p, sellerOverrides: arr }; });
  const rmOverride = (i) => setC((p) => ({ ...p, sellerOverrides: p.sellerOverrides.filter((_, x) => x !== i) }));

  async function save() {
    setSaving(true); setMsg("");
    try {
      const r = await (await fetch("/api/admin/commission", { method: "PATCH", headers: { "content-type": "application/json" }, cache: "no-store", body: JSON.stringify(c) })).json();
      setMsg(r.ok ? "Saved ✓" : (r.errors ? Object.values(r.errors).flat().join(", ") : r.error || "Could not save"));
      setTimeout(() => setMsg(""), 2500);
    } finally { setSaving(false); }
  }

  if (loading || !c) return <AdminShell active="/admin/commission" title="Commission" subtitle="Marketplace commission settings"><p className="text-[13px] text-[#6b7280]">Loading…</p></AdminShell>;

  const actions = <button onClick={save} disabled={saving} className="h-[36px] px-5 rounded-full bg-[#3056D3] text-white text-[13px] font-bold disabled:opacity-60">{saving ? "Saving…" : "Save changes"}</button>;

  return (
    <AdminShell active="/admin/commission" title="Commission" subtitle="Marketplace commission settings" actions={actions}>
      {msg && <p className={`text-[13px] font-semibold mb-3 ${msg.includes("✓") ? "text-[#1e7a5a]" : "text-[#d23f3f]"}`}>{msg}</p>}

      <SectionCard title="Global settings" className="mb-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="block"><span className="block text-[12.5px] font-semibold text-[#0e1b4d] mb-1">Global commission (%)</span><input type="number" className={input + " w-full"} value={c.global} onChange={(e) => setField("global", e.target.value)} /></label>
          <label className="block"><span className="block text-[12.5px] font-semibold text-[#0e1b4d] mb-1">GST (%)</span><input type="number" className={input + " w-full"} value={c.gst} onChange={(e) => setField("gst", e.target.value)} /></label>
          <label className="block"><span className="block text-[12.5px] font-semibold text-[#0e1b4d] mb-1">Platform fee (%)</span><input type="number" className={input + " w-full"} value={c.platformFee} onChange={(e) => setField("platformFee", e.target.value)} /></label>
        </div>
      </SectionCard>

      <SectionCard title="Category commission" action={<button onClick={addCatRate} className="text-[12px] font-bold text-[#3056D3]">+ Add category</button>} className="mb-4">
        {c.categoryRates.length === 0 ? <p className="text-[13px] text-[#6b7280]">No category overrides — all categories use the global rate.</p> : (
          <div className="space-y-2">
            {c.categoryRates.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <select className={input + " flex-1 max-w-[300px]"} value={r.category} onChange={(e) => setCatRate(i, "category", e.target.value)}>
                  {cats.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}
                  {!cats.some((x) => x.slug === r.category) && <option value={r.category}>{r.category}</option>}
                </select>
                <input type="number" className={pctBox} value={r.rate} onChange={(e) => setCatRate(i, "rate", e.target.value)} /><span className="text-[13px] text-[#6b7280]">%</span>
                <button onClick={() => rmCatRate(i)} className="text-[12px] font-semibold text-[#d23f3f] ml-2">Remove</button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Seller overrides" action={<button onClick={addOverride} className="text-[12px] font-bold text-[#3056D3]">+ Add seller</button>}>
        {c.sellerOverrides.length === 0 ? <p className="text-[13px] text-[#6b7280]">No seller overrides — sellers use their category/global rate.</p> : (
          <div className="space-y-2">
            {c.sellerOverrides.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <select className={input + " flex-1 max-w-[300px]"} value={o.sellerId} onChange={(e) => setOverride(i, "sellerId", e.target.value)}>
                  {sellers.map((s) => <option key={s.id} value={s.id}>{s.company}</option>)}
                  {!sellers.some((s) => s.id === o.sellerId) && <option value={o.sellerId}>{o.sellerName || o.sellerId}</option>}
                </select>
                <input type="number" className={pctBox} value={o.rate} onChange={(e) => setOverride(i, "rate", e.target.value)} /><span className="text-[13px] text-[#6b7280]">%</span>
                <button onClick={() => rmOverride(i)} className="text-[12px] font-semibold text-[#d23f3f] ml-2">Remove</button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </AdminShell>
  );
}
