"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/ui";
import { AInput, AButton, Alert, Divider, OtpBoxes, GoogleButton } from "./fields";
import { detectChannel, landingFor, postJSON, fetchSession } from "./helpers";

export default function LoginForm({ googleEnabled = false, callbackUrl = "" }) {
  const [step, setStep] = useState("identify"); // identify | otp | password
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const channel = detectChannel(identifier);

  async function done() {
    const s = await fetchSession();
    const role = s?.user?.role;
    // Buyers land on the home page after login (natural ecommerce flow); staff
    // go to their dashboards. A callbackUrl (came from a protected page) wins.
    const target = callbackUrl || (!role || role === "buyer" ? "/" : landingFor(role, s?.user?.sellerStatus));
    window.location.href = target;
  }

  async function sendOtp() {
    setErr(""); setNote("");
    if (!identifier.trim()) return setErr("Enter your mobile number or email.");
    setLoading(true);
    const r = await postJSON("/api/auth/otp/request", { identifier: identifier.trim(), channel, purpose: "login" });
    setLoading(false);
    if (r.status === 429) return setErr(r.error || "Too many requests. Try again later.");
    if (r.status >= 400 && r.ok !== true) return setErr(r.error || "Could not send the code.");
    setNote(`We sent a 6-digit code to your ${channel === "email" ? "email" : "mobile"}.`);
    setStep("otp");
  }

  async function verifyOtp() {
    setErr("");
    if (code.length !== 6) return setErr("Enter the 6-digit code.");
    setLoading(true);
    const res = await signIn("otp", { identifier: identifier.trim(), channel, code, redirect: false });
    setLoading(false);
    if (res?.error) return setErr("Incorrect or expired code. Please try again.");
    await done();
  }

  async function loginPassword() {
    setErr("");
    if (!identifier.trim() || !password) return setErr("Enter your email and password.");
    setLoading(true);
    let res;
    try { res = await signIn("credentials", { email: identifier.trim(), password, redirect: false }); }
    catch { res = { status: 0, error: "SignInError" }; }
    setLoading(false);
    if (res?.status === 429) return setErr("Too many failed sign-in attempts. Please wait a few minutes and try again.");
    if (res?.error) return setErr("Invalid email or password.");
    await done();
  }

  const footer = <>New here? <a href="/signup" className="text-[#3056D3] font-semibold">Create an account</a></>;

  if (step === "otp") {
    return (
      <AuthCard title="Verify OTP" sub={`Enter the 6-digit code sent to your ${channel === "email" ? "email" : "mobile"}`}
        footer={<button onClick={sendOtp} className="text-[#3056D3] font-semibold">Resend code</button>}>
        <Alert>{err}</Alert>
        {note && <Alert kind="success">{note}</Alert>}
        <OtpBoxes value={code} onChange={setCode} />
        <AButton onClick={verifyOtp} loading={loading}>Verify &amp; Continue</AButton>
        <button onClick={() => { setStep("identify"); setCode(""); setErr(""); }} className="text-[13px] text-[#6b7280] w-full">← Change mobile / email</button>
      </AuthCard>
    );
  }

  if (step === "password") {
    return (
      <AuthCard title="Log in with password" sub="Enter your email and password" footer={footer}>
        <Alert>{err}</Alert>
        <AInput label="Email ID" type="email" value={identifier} onChange={setIdentifier} placeholder="you@example.com" autoComplete="username" />
        <AInput label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
        <div className="text-right -mt-1"><a href="/forgot-password" className="text-[12px] text-[#3056D3] font-semibold">Forgot password?</a></div>
        <AButton onClick={loginPassword} loading={loading}>Log In</AButton>
        <button onClick={() => { setStep("identify"); setErr(""); }} className="text-[13px] text-[#3056D3] font-semibold w-full">Use OTP instead</button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Log In or Sign Up" sub="Welcome back to Mediconeeds" footer={footer}>
      <Alert>{err}</Alert>
      <AInput label="Mobile or Email ID" value={identifier} onChange={setIdentifier} placeholder="eg. 9847372621 or you@example.com" autoComplete="username" />
      <AButton onClick={sendOtp} loading={loading}>Continue</AButton>
      <Divider />
      {googleEnabled && <GoogleButton onClick={() => signIn("google", { callbackUrl: callbackUrl || "/" })} />}
      <button onClick={() => { setStep("password"); setErr(""); }} className="text-[13px] text-[#3056D3] font-semibold w-full">Log in with password instead</button>
      <p className="text-[11px] text-[#9ca3af] text-center">By continuing you agree to Mediconeeds's <a href="/policy/terms" className="underline">Terms</a> &amp; <a href="/policy/privacy" className="underline">Privacy Policy</a>.</p>
    </AuthCard>
  );
}
