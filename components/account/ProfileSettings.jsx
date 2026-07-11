"use client";
import { useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { avatarInitials } from "@/lib/identity";

// Read a File and center-crop it to a square, then downscale to 256px JPEG.
// This is the "upload → crop → save" step done client-side (no library needed).
function cropSquare(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const inputCls = "w-full h-[42px] px-4 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3] bg-white disabled:bg-[#f5f6fb] disabled:text-[#6b7280]";

export default function ProfileSettings({ initial }) {
  const [f, setF] = useState(initial);
  const [avatar, setAvatar] = useState(initial.avatarUrl || "");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function onPickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(""); setMsg("");
    try {
      const dataUrl = await cropSquare(file);
      setAvatar(dataUrl);
      const res = await fetch("/api/account/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { setErr(data.error || "Could not upload the photo."); return; }
      setMsg("Profile photo updated.");
    } catch {
      setErr("Could not read that image.");
    }
  }

  // Refresh the JWT session so the navbar greeting reflects a new name without a
  // re-login. Uses NextAuth's session-update endpoint (no SessionProvider needed).
  async function refreshSessionName(name) {
    try {
      const { csrfToken } = await (await fetch("/api/auth/csrf")).json();
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csrfToken, data: { name } }),
      });
    } catch {}
  }

  async function save() {
    setErr(""); setMsg(""); setSaving(true);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: f.name, phone: f.phone, gender: f.gender, dob: f.dob }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) await refreshSessionName(f.name);
    setSaving(false);
    if (!res.ok || !data.ok) return setErr(data.error || "Could not save your changes.");
    setMsg("Changes saved.");
  }

  async function deleteAccount() {
    if (!confirm("Delete your account? This disables sign-in and cannot be undone.")) return;
    const res = await fetch("/api/account/profile", { method: "DELETE" });
    if (res.ok) signOut({ callbackUrl: "/" });
    else setErr("Could not delete the account. Please contact support.");
  }

  const initials = avatarInitials({ name: f.name, email: f.email });

  return (
    <div className="space-y-4 max-w-[620px]">
      {/* Personal information */}
      <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-6 space-y-4">
        <h3 className="text-[15px] font-bold text-[#0e1b4d]">Personal Information</h3>

        <div className="flex items-center gap-4">
          {avatar ? (
            <img src={avatar} alt="" className="w-16 h-16 rounded-full object-cover border border-[#eef0f5]" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[rgba(48,86,211,0.12)] flex items-center justify-center font-bold text-[20px] text-[#3056D3]">{initials}</div>
          )}
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-[13px] font-bold text-[#3056D3] border border-[#3056D3] rounded-full px-4 py-2">Upload photo</button>
            <p className="text-[11px] text-[#9ca3af] mt-1">JPG, PNG or WEBP. Square crop, up to ~300&nbsp;KB.</p>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onPickFile} className="hidden" />
          </div>
        </div>

        <label className="block">
          <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Full Name</span>
          <input className={inputCls} value={f.name} onChange={set("name")} placeholder="Your name" />
        </label>
        <label className="block">
          <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Email <span className="text-[#9ca3af] font-normal">(login ID — cannot be changed)</span></span>
          <input className={inputCls} value={f.email} disabled />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Phone</span>
            <input className={inputCls} value={f.phone} onChange={set("phone")} placeholder="+91 …" />
          </label>
          <label className="block">
            <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Date of Birth</span>
            <input type="date" className={inputCls} value={f.dob} onChange={set("dob")} />
          </label>
        </div>
        <label className="block">
          <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Gender</span>
          <select className={inputCls} value={f.gender} onChange={set("gender")}>
            <option value="unspecified">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </label>

        {err && <div className="text-[13px] text-[#cf5c2d] font-semibold">{err}</div>}
        {msg && <div className="text-[13px] text-[#006f5f] font-semibold">{msg}</div>}
        <button onClick={save} disabled={saving} className="inline-flex items-center justify-center h-[44px] px-6 rounded-full text-[15px] font-bold bg-[#3056D3] text-white disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
      </div>

      {/* Security */}
      <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-6 space-y-3">
        <h3 className="text-[15px] font-bold text-[#0e1b4d]">Security</h3>
        <a href="/reset-password" className="block text-[14px] font-semibold text-[#3056D3]">Change Password →</a>
        <button onClick={() => signOut({ callbackUrl: "/" })} className="block text-[14px] font-semibold text-[#0e1b4d] text-left">Log out of this device →</button>
        <button onClick={deleteAccount} className="block text-[14px] font-semibold text-[#cf5c2d] text-left">Delete Account →</button>
      </div>
    </div>
  );
}
