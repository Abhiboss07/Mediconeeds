"use client";
import { useState } from "react";

const BLANK = { label: "Home", name: "", line: "", phone: "", pincode: "", isDefault: false };

function AddressForm({ initial, onCancel, onSaved }) {
  const [f, setF] = useState({ ...BLANK, ...initial });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function save() {
    if (!f.line.trim()) return setErr("Please enter the full address.");
    setErr(""); setSaving(true);
    const editing = !!initial?.id;
    const res = await fetch("/api/account/addresses", {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editing ? { ...f, id: initial.id } : f),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok || !data.ok) return setErr(data.error || "Could not save the address.");
    onSaved(data.addresses);
  }

  const input = "w-full h-[42px] px-3 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3] bg-white";
  return (
    <div className="bg-white rounded-[14px] border border-[rgba(48,86,211,0.3)] p-5 space-y-3">
      {err && <div className="text-[13px] text-[#cf5c2d] font-semibold">{err}</div>}
      <div className="grid grid-cols-2 gap-3">
        <input className={input} placeholder="Label (Home / Work)" value={f.label} onChange={set("label")} />
        <input className={input} placeholder="Full name" value={f.name} onChange={set("name")} />
      </div>
      <textarea className={input + " h-[72px] py-2"} placeholder="Full address" value={f.line} onChange={set("line")} />
      <div className="grid grid-cols-2 gap-3">
        <input className={input} placeholder="Phone" value={f.phone} onChange={set("phone")} />
        <input className={input} placeholder="Pincode" value={f.pincode} onChange={set("pincode")} />
      </div>
      <label className="flex items-center gap-2 text-[13px] text-[#0e1b4d]">
        <input type="checkbox" checked={f.isDefault} onChange={set("isDefault")} /> Set as default address
      </label>
      <div className="flex gap-2">
        <button onClick={save} disabled={saving} className="text-[13px] font-bold text-white bg-[#3056D3] rounded-full px-5 py-2.5 disabled:opacity-60">{saving ? "Saving…" : "Save Address"}</button>
        <button onClick={onCancel} className="text-[13px] font-semibold text-[#6b7280] px-4">Cancel</button>
      </div>
    </div>
  );
}

export default function AddressBook({ initial = [] }) {
  const [addrs, setAddrs] = useState(initial);
  const [editing, setEditing] = useState(null); // id | "new" | null

  async function remove(id) {
    const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) setAddrs(data.addresses);
  }
  function onSaved(list) { setAddrs(list); setEditing(null); }

  return (
    <div className="space-y-4">
      {addrs.length === 0 && editing !== "new" && (
        <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-8 text-center">
          <div className="text-[15px] font-bold text-[#0e1b4d]">No saved addresses</div>
          <p className="text-[13px] text-[#6b7280] mt-1">Add an address to speed up checkout.</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {addrs.map((a) =>
          editing === a.id ? (
            <AddressForm key={a.id} initial={a} onCancel={() => setEditing(null)} onSaved={onSaved} />
          ) : (
            <div key={a.id} className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[14px] font-bold text-[#0e1b4d]">{a.label}</span>
                {a.isDefault && <span className="text-[11px] font-semibold text-[#3056D3] bg-[rgba(48,86,211,0.1)] rounded-full px-2 py-0.5">Default</span>}
              </div>
              {a.name && <p className="text-[13px] font-semibold text-[#0e1b4d]">{a.name}</p>}
              <p className="text-[14px] text-[#444]">{a.line}</p>
              {(a.phone || a.pincode) && <p className="text-[13px] text-[#6b7280] mt-1">{[a.phone, a.pincode].filter(Boolean).join(" · ")}</p>}
              <div className="flex gap-3 mt-3 text-[13px] font-semibold">
                <button onClick={() => setEditing(a.id)} className="text-[#3056D3]">Edit</button>
                <button onClick={() => remove(a.id)} className="text-[#cf5c2d]">Remove</button>
              </div>
            </div>
          )
        )}

        {editing === "new" ? (
          <AddressForm onCancel={() => setEditing(null)} onSaved={onSaved} />
        ) : (
          <button onClick={() => setEditing("new")} className="rounded-[14px] border-2 border-dashed border-[rgba(48,86,211,0.3)] p-5 text-[#3056D3] font-bold text-[14px] min-h-[80px]">+ Add New Address</button>
        )}
      </div>
    </div>
  );
}
