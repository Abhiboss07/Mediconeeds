"use client";
import { useState } from "react";
import { TextField, SelectField, ChipMulti, FileField } from "@/components/forms/FormKit";
import { validate } from "@/lib/forms";
import { SELLER_CATEGORIES } from "@/lib/seller/models";
import { submitSellerApplication } from "@/lib/seller/api";

const STEPS = ["Business", "Contact", "Bank", "Categories", "Documents", "Review"];

// Per-step validation schemas (labels power the error messages).
const SCHEMAS = [
  { company: { label: "Company name", required: true }, owner: { label: "Owner name", required: true }, gst: { label: "GST", required: true, type: "gst" }, pan: { label: "PAN", required: true }, address: { label: "Address", required: true } },
  { mobile: { label: "Mobile", required: true, type: "phone" }, email: { label: "Email", required: true, type: "email" }, website: { label: "Website" } },
  { bankName: { label: "Bank name", required: true }, account: { label: "Account number", required: true }, ifsc: { label: "IFSC", required: true } },
  { categories: { label: "Categories", required: true } },
  { gstCert: { label: "GST certificate", required: true }, pan_doc: { label: "PAN document", required: true } },
];

export default function RegisterWizard() {
  const [step, setStep] = useState(0);
  const [v, setV] = useState({ categories: [] });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  // FormKit primitives all call onChange(name, value).
  const onField = (name, val) => setV((s) => ({ ...s, [name]: val }));
  const field = (name) => ({ name, value: v[name] || "", onChange: onField, error: errors[name] });

  const validateStep = () => {
    const schema = SCHEMAS[step];
    if (!schema) return true;
    const e = validate(v, schema);
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setBusy(true);
    try {
      const res = await submitSellerApplication({
        company: v.company, owner: v.owner, gstin: v.gst, pan: v.pan, cin: v.cin, address: v.address,
        phone: v.mobile, email: v.email, website: v.website, categories: v.categories,
        bank: { name: v.bankName, account: v.account, ifsc: v.ifsc },
      });
      setDone(res.ref || res.id || "SLR-PENDING");
    } catch (e) {
      setErrors({ _submit: e.message || "Submission failed. Please try again." });
    } finally { setBusy(false); }
  };

  if (done) {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-[#e6f4ee] text-[#1E7A5A] flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5L20 6" /></svg>
        </div>
        <h2 className="text-[24px] font-extrabold text-[#0e1b4d]">Application submitted!</h2>
        <p className="text-[14px] text-[#6b7280] mt-2 max-w-[46ch] mx-auto">Thank you. Our team will verify your documents and get back within 3–5 business days.</p>
        <p className="text-[13px] mt-4">Reference ID: <span className="font-bold text-[#0e1b4d]">{done}</span></p>
        <div className="flex flex-wrap gap-3 justify-center mt-7">
          <a href="/seller/dashboard" className="inline-flex h-[46px] items-center px-6 rounded-full bg-[#3056D3] text-white text-[14px] font-bold">Preview seller dashboard →</a>
          <a href="/" className="inline-flex h-[46px] items-center px-6 rounded-full border border-[rgba(111,115,132,0.4)] text-[#0e1b4d] text-[14px] font-bold">Back to home</a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* stepper */}
      <ol className="flex items-center gap-1.5 mb-8 overflow-x-auto pb-1">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-1.5 shrink-0">
            <button type="button" onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 text-[12.5px] font-bold ${i === step ? "bg-[#3056D3] text-white" : i < step ? "bg-[#e6f4ee] text-[#1E7A5A]" : "bg-[#f0f2f7] text-[#9ca3af]"}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${i === step ? "bg-white/25" : i < step ? "bg-[#1E7A5A] text-white" : "bg-white text-[#9ca3af]"}`}>{i < step ? "✓" : i + 1}</span>
              {label}
            </button>
            {i < STEPS.length - 1 && <span className="w-4 h-[2px] bg-[#e5e7eb]" />}
          </li>
        ))}
      </ol>

      <div className="min-h-[280px]">
        {step === 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Company name" required placeholder="Dr Awish Healthcare Pvt Ltd" {...field("company")} />
            <TextField label="Owner name" required placeholder="Full name" {...field("owner")} />
            <TextField label="GSTIN" required placeholder="07ABWPK1234M1Z5" {...field("gst")} />
            <TextField label="PAN" required placeholder="ABWPK1234M" {...field("pan")} />
            <TextField label="CIN (optional)" placeholder="U24239DL2019PTC351234" {...field("cin")} />
            <TextField label="Registered address" required placeholder="Street, city, pincode" {...field("address")} />
          </div>
        )}
        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Mobile" required type="tel" placeholder="+91 …" {...field("mobile")} />
            <TextField label="Email" required type="email" placeholder="you@company.com" {...field("email")} />
            <TextField label="Website (optional)" placeholder="https://…" {...field("website")} />
          </div>
        )}
        {step === 2 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <TextField label="Bank name" required placeholder="HDFC Bank" {...field("bankName")} />
            <TextField label="Account number" required placeholder="Account number" {...field("account")} />
            <TextField label="IFSC" required placeholder="HDFC0000123" {...field("ifsc")} />
          </div>
        )}
        {step === 3 && (
          <ChipMulti label="Which categories will you sell in?" name="categories" value={v.categories} onChange={onField} options={SELLER_CATEGORIES} error={errors.categories} />
        )}
        {step === 4 && (
          <div className="grid sm:grid-cols-2 gap-4">
            <FileField label="GST certificate *" name="gstCert" value={v.gstCert} onChange={onField} hint="PDF / JPG / PNG" />
            <FileField label="PAN card *" name="pan_doc" value={v.pan_doc} onChange={onField} hint="PDF / JPG / PNG" />
            <FileField label="Cancelled cheque" name="cheque" value={v.cheque} onChange={onField} hint="Optional" />
            <FileField label="Trade licence" name="license" value={v.license} onChange={onField} hint="Optional" />
            {(errors.gstCert || errors.pan_doc) && <p className="text-[12px] text-[#d23f3f] sm:col-span-2">Please upload the required documents.</p>}
          </div>
        )}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-[14px] text-[#6b7280]">Review your details before submitting.</p>
            {[
              ["Company", v.company], ["Owner", v.owner], ["GSTIN", v.gst], ["PAN", v.pan], ["CIN", v.cin || "—"], ["Address", v.address],
              ["Mobile", v.mobile], ["Email", v.email], ["Website", v.website || "—"],
              ["Bank", `${v.bankName || "—"} · ${v.account || "—"} · ${v.ifsc || "—"}`],
              ["Categories", (v.categories || []).join(", ") || "—"],
              ["Documents", [v.gstCert, v.pan_doc, v.cheque, v.license].filter(Boolean).join(", ") || "—"],
            ].map(([k, val]) => (
              <div key={k} className="flex gap-4 text-[13.5px] border-b border-[#eef0f5] pb-2">
                <span className="w-[120px] shrink-0 text-[#6b7280] font-semibold">{k}</span>
                <span className="text-[#0e1b4d] font-medium break-words">{val}</span>
              </div>
            ))}
            {errors._submit && <p className="text-[13px] text-[#d23f3f]">{errors._submit}</p>}
          </div>
        )}
      </div>

      {/* nav */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-[#eef0f5]">
        <button type="button" onClick={back} disabled={step === 0}
          className="h-[46px] px-6 rounded-full border border-[rgba(111,115,132,0.4)] text-[14px] font-bold text-[#0e1b4d] disabled:opacity-40">Back</button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="h-[46px] px-7 rounded-full bg-[#3056D3] text-white text-[14px] font-bold">Continue</button>
        ) : (
          <button type="button" onClick={submit} disabled={busy} className="h-[46px] px-7 rounded-full bg-[#1E7A5A] text-white text-[14px] font-bold disabled:opacity-60">{busy ? "Submitting…" : "Submit application"}</button>
        )}
      </div>
    </div>
  );
}
