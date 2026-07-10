"use client";
import { useState } from "react";
import { AuthCard } from "@/components/ui";
import { AInput, AButton, Alert } from "./fields";
import { detectChannel, postJSON } from "./helpers";

export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    setErr("");
    if (!identifier.trim()) return setErr("Enter your registered mobile or email.");
    const channel = detectChannel(identifier);
    setLoading(true);
    const r = await postJSON("/api/auth/otp/request", { identifier: identifier.trim(), channel, purpose: "reset" });
    setLoading(false);
    if (r.status === 429) return setErr(r.error || "Too many requests. Try again later.");
    if (r.ok !== true && r.status >= 500) return setErr(r.error || "Could not send the code.");
    // Always proceed (anti-enumeration): the reset page verifies the code.
    const q = new URLSearchParams({ id: identifier.trim(), ch: channel });
    window.location.href = `/reset-password?${q.toString()}`;
  }

  return (
    <AuthCard title="Forgot Password?" sub="We'll send a verification code to reset it"
      footer={<a href="/login" className="text-[#3056D3] font-semibold">Back to login</a>}>
      <Alert>{err}</Alert>
      <AInput label="Mobile or Email ID" value={identifier} onChange={setIdentifier} placeholder="eg. 9847372621 or you@example.com" autoComplete="username" />
      <AButton onClick={send} loading={loading}>Send Code</AButton>
    </AuthCard>
  );
}
