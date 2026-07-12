"use client";
// Progressive enhancement for the static header's "Deliver to ____" control.
// On mount it wires both the desktop and mobile buttons to open an address
// selector, and reflects the buyer's default address in the navbar. Addresses
// are the same per-user records used by the account portal (/api/account/addresses).
import { useEffect, useState, useCallback } from "react";

function deliverText(a) {
  if (!a) return "Select address";
  const bits = [a.label || a.name, a.pincode].filter(Boolean);
  return bits.join(", ") || (a.line ? a.line.slice(0, 22) : "Saved address");
}

export default function AddressPortal() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | form
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0] || null;

  // Reflect current default into the header buttons.
  const paintHeader = useCallback((addr) => {
    const btns = Array.from(document.querySelectorAll("header button")).filter((b) => /Deliver to/i.test(b.textContent));
    btns.forEach((b) => {
      const ps = b.querySelectorAll("p");
      const loc = ps[ps.length - 1];
      if (loc) loc.textContent = deliverText(addr);
    });
  }, []);

  const loadAddresses = useCallback(async () => {
    setLoading(true);
    try {
      const r = await (await fetch("/api/account/addresses")).json();
      const list = r.ok ? r.addresses || [] : [];
      setAddresses(list);
      paintHeader(list.find((a) => a.isDefault) || list[0] || null);
    } catch { /* keep placeholder */ }
    finally { setLoading(false); }
  }, [paintHeader]);

  // Wire header buttons + initial data.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let u = null;
      try { u = (await (await fetch("/api/auth/session")).json())?.user ?? null; } catch {}
      if (cancelled) return;
      setUser(u);
      setReady(true);
      if (u) await loadAddresses(); else setLoading(false);
    })();

    const onClick = (e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); };
    const btns = Array.from(document.querySelectorAll("header button")).filter((b) => /Deliver to/i.test(b.textContent));
    btns.forEach((b) => { b.style.cursor = "pointer"; b.addEventListener("click", onClick); });
    return () => { cancelled = true; btns.forEach((b) => b.removeEventListener("click", onClick)); };
  }, [loadAddresses]);

  async function setDefault(id) {
    setBusy(true); setErr("");
    try {
      const r = await (await fetch("/api/account/addresses", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, isDefault: true }) })).json();
      if (r.ok) { setAddresses(r.addresses); paintHeader(r.addresses.find((a) => a.isDefault)); }
      else setErr(r.error || "Could not update");
    } finally { setBusy(false); }
  }

  async function remove(id) {
    setBusy(true); setErr("");
    try {
      const r = await (await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, { method: "DELETE" })).json();
      if (r.ok) { setAddresses(r.addresses); paintHeader(r.addresses.find((a) => a.isDefault) || r.addresses[0] || null); }
      else setErr(r.error || "Could not delete");
    } finally { setBusy(false); }
  }

  function startAdd() { setEditing({ label: "Home", name: "", line: "", phone: "", pincode: "", isDefault: addresses.length === 0 }); setView("form"); setErr(""); }
  function startEdit(a) { setEditing({ ...a }); setView("form"); setErr(""); }

  async function saveForm(e) {
    e.preventDefault();
    setErr("");
    if (!editing.line || !editing.line.trim()) return setErr("Address line is required.");
    setBusy(true);
    try {
      const method = editing.id ? "PATCH" : "POST";
      const r = await (await fetch("/api/account/addresses", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(editing) })).json();
      if (r.ok) { setAddresses(r.addresses); paintHeader(r.addresses.find((a) => a.isDefault) || r.addresses[0]); setView("list"); }
      else setErr(r.error || "Could not save address.");
    } catch { setErr("Network error."); }
    finally { setBusy(false); }
  }

  if (!open) return null;

  const field = "w-full h-[42px] px-3 rounded-[10px] border border-[#e2e5ee] text-[14px] focus:border-[#3056D3] outline-none";

  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 pt-[10vh]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative bg-white rounded-[16px] w-full max-w-[460px] p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[17px] font-extrabold text-[#0e1b4d]">Choose delivery address</h3>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-[#9ca3af] text-[24px] leading-none">×</button>
        </div>

        {ready && !user ? (
          <div className="text-center py-6">
            <p className="text-[14px] text-[#374151] mb-4">Log in to save and choose delivery addresses.</p>
            <a href="/login" className="inline-block h-[44px] leading-[44px] px-6 rounded-full bg-[#3056D3] text-white text-[14px] font-bold">Login / Signup</a>
          </div>
        ) : loading ? (
          <p className="text-[13px] text-[#6b7280]">Loading…</p>
        ) : view === "form" ? (
          <form onSubmit={saveForm}>
            <label className="block text-[12px] font-semibold text-[#374151] mb-1">Label</label>
            <input className={field} value={editing.label || ""} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Home / Clinic / Warehouse" />
            <label className="block text-[12px] font-semibold text-[#374151] mb-1 mt-3">Full address</label>
            <input className={field} value={editing.line || ""} onChange={(e) => setEditing({ ...editing, line: e.target.value })} placeholder="Building, street, area, city" autoFocus />
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><label className="block text-[12px] font-semibold text-[#374151] mb-1">Pincode</label><input className={field} value={editing.pincode || ""} onChange={(e) => setEditing({ ...editing, pincode: e.target.value })} placeholder="Pincode" /></div>
              <div><label className="block text-[12px] font-semibold text-[#374151] mb-1">Phone</label><input className={field} value={editing.phone || ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="Phone" /></div>
            </div>
            <label className="flex items-center gap-2 mt-3 text-[13px] text-[#374151]"><input type="checkbox" checked={!!editing.isDefault} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} /> Set as default delivery address</label>
            {err && <p className="text-[12.5px] text-[#d23f3f] font-semibold mt-3">{err}</p>}
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => setView("list")} className="flex-1 h-[44px] rounded-full border border-[#e2e5ee] text-[14px] font-bold text-[#374151]">Back</button>
              <button type="submit" disabled={busy} className="flex-1 h-[44px] rounded-full bg-[#3056D3] text-white text-[14px] font-bold disabled:opacity-60">{busy ? "Saving…" : "Save address"}</button>
            </div>
          </form>
        ) : (
          <>
            {addresses.length === 0 ? (
              <p className="text-[13px] text-[#6b7280] mb-4">No saved addresses yet. Add your first delivery address.</p>
            ) : (
              <div className="space-y-2.5 mb-4">
                {addresses.map((a) => (
                  <div key={a.id} className={`rounded-[12px] border p-3.5 ${a.isDefault ? "border-[#3056D3] bg-[#f5f8ff]" : "border-[#eef0f5]"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><span className="font-bold text-[#0e1b4d] text-[14px]">{a.label || "Address"}</span>{a.isDefault && <span className="text-[10.5px] font-bold text-[#3056D3] bg-[#e8eeff] rounded-full px-2 py-0.5">DEFAULT</span>}</div>
                        <p className="text-[13px] text-[#374151] mt-0.5">{a.line}</p>
                        <p className="text-[12px] text-[#6b7280]">{[a.pincode, a.phone].filter(Boolean).join(" · ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2.5 text-[12px] font-semibold">
                      {!a.isDefault && <button disabled={busy} onClick={() => setDefault(a.id)} className="text-[#1E7A5A] disabled:opacity-50">Deliver here</button>}
                      <button disabled={busy} onClick={() => startEdit(a)} className="text-[#3056D3] disabled:opacity-50">Edit</button>
                      <button disabled={busy} onClick={() => remove(a.id)} className="text-[#d23f3f] disabled:opacity-50">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {err && <p className="text-[12.5px] text-[#d23f3f] font-semibold mb-3">{err}</p>}
            <button onClick={startAdd} className="w-full h-[44px] rounded-full border border-dashed border-[#3056D3] text-[#3056D3] text-[14px] font-bold">+ Add new address</button>
          </>
        )}
      </div>
    </div>
  );
}
