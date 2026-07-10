"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/ui";
import { AInput, AButton, Alert, OtpBoxes } from "./fields";
import { postJSON } from "./helpers";

export default function ResetPasswordForm() {
  const sp = useSearchParams();
  const identifier = sp.get("id") || "";
  const channel = sp.get("ch") || "email";

  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr("");
    if (!identifier) return setErr("Missing identifier. Start again from Forgot Password.");
    if (code.length !== 6) return setErr("Enter the 6-digit code.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return setErr("Include an uppercase letter, a lowercase letter, and a number.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setLoading(true);
    const r = await postJSON("/api/auth/reset", { identifier, channel, code, password });
    setLoading(false);
    if (r.ok !== true) return setErr(r.error || "Could not reset password.");
    setOk(true);
  }

  if (ok) {
    return (
      <AuthCard title="Password updated" sub="You can now log in with your new password"
        footer={<a href="/login" className="text-[#3056D3] font-semibold">Back to login</a>}>
        <Alert kind="success">Your password has been reset successfully.</Alert>
        <AButton onClick={() => (window.location.href = "/login")}>Go to Login</AButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" sub={identifier ? `Enter the code sent to ${identifier}` : "Choose a strong password"}
      footer={<a href="/login" className="text-[#3056D3] font-semibold">Back to login</a>}>
      <Alert>{err}</Alert>
      <div>
        <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-2 text-center">Verification code</span>
        <OtpBoxes value={code} onChange={setCode} />
      </div>
      <AInput label="New Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="new-password" />
      <AInput label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="••••••••" autoComplete="new-password" />
      <AButton onClick={submit} loading={loading}>Update Password</AButton>
    </AuthCard>
  );
}
