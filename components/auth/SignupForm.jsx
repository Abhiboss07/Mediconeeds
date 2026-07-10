"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/ui";
import { AInput, AButton, Alert, Divider, OtpBoxes, GoogleButton } from "./fields";
import { landingFor, postJSON, fetchSession } from "./helpers";

export default function SignupForm({ googleEnabled = false }) {
  const [step, setStep] = useState("form"); // form | otp
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function createAccount() {
    setErr(""); setNote("");
    if (name.trim().length < 2) return setErr("Enter your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("Enter a valid email.");
    setLoading(true);
    const r = await postJSON("/api/auth/otp/request", { identifier: email.trim(), channel: "email", purpose: "signup" });
    setLoading(false);
    if (r.status === 409) return setErr(r.error || "An account already exists. Please log in.");
    if (r.ok !== true) return setErr(r.error || "Could not send the code.");
    setNote("We sent a 6-digit code to your email.");
    setStep("otp");
  }

  async function verify() {
    setErr("");
    if (code.length !== 6) return setErr("Enter the 6-digit code.");
    setLoading(true);
    const res = await signIn("otp", {
      identifier: email.trim(), channel: "email", code, purpose: "signup", mode: "signup",
      name: name.trim(), phone: phone.trim(), redirect: false,
    });
    setLoading(false);
    if (res?.error) return setErr("Incorrect or expired code. Please try again.");
    const s = await fetchSession();
    window.location.href = landingFor(s?.user?.role, s?.user?.sellerStatus);
  }

  const footer = <>Already have an account? <a href="/login" className="text-[#3056D3] font-semibold">Log in</a></>;

  if (step === "otp") {
    return (
      <AuthCard title="Verify your email" sub={`Enter the 6-digit code sent to ${email}`}
        footer={<button onClick={createAccount} className="text-[#3056D3] font-semibold">Resend code</button>}>
        <Alert>{err}</Alert>
        {note && <Alert kind="success">{note}</Alert>}
        <OtpBoxes value={code} onChange={setCode} />
        <AButton onClick={verify} loading={loading}>Verify &amp; Create Account</AButton>
        <button onClick={() => { setStep("form"); setCode(""); setErr(""); }} className="text-[13px] text-[#6b7280] w-full">← Edit details</button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Create your account" sub="Join Mediconeeds for dermatologist-formulated skincare" footer={footer}>
      <Alert>{err}</Alert>
      <AInput label="Full Name" value={name} onChange={setName} placeholder="Your name" autoComplete="name" />
      <AInput label="Mobile Number" type="tel" value={phone} onChange={setPhone} placeholder="+91 ..." autoComplete="tel" />
      <AInput label="Email ID" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
      <AButton onClick={createAccount} loading={loading}>Create Account</AButton>
      {googleEnabled && <><Divider /><GoogleButton onClick={() => signIn("google", { callbackUrl: "/account" })} /></>}
    </AuthCard>
  );
}
