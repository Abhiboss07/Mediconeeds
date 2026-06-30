"use client";
import { useState } from "react";
import { TextField, TextArea, ChipMulti, FileField } from "./FormKit";
import { validate, postJSON, PRODUCT_CATEGORIES } from "@/lib/forms";

const schema = {
  company: { label: "Company name", required: true },
  contactName: { label: "Contact name", required: true },
  email: { label: "Email", required: true, type: "email" },
  phone: { label: "Phone", required: true, type: "phone" },
  gst: { label: "GSTIN", type: "gst" },
};
const init = {
  company: "", contactName: "", email: "", phone: "", gst: "", city: "", website: "",
  categories: [], gstCertificate: "", catalogue: "", notes: "",
};

const STEPS = ["Register", "Verification", "Go live"];

export default function SupplierForm() {
  const [v, setV] = useState(init);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [ref, setRef] = useState("");
  const [serverErr, setServerErr] = useState("");
  const on = (name, value) => setV((s) => ({ ...s, [name]: value }));

  async function submit(e) {
    e.preventDefault();
    const errs = validate(v, schema);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setStatus("submitting"); setServerErr("");
    try {
      const r = await postJSON("/api/supplier-application", v);
      setRef(r.ref); setStatus("done");
    } catch (err) { setServerErr(err.message); setStatus("error"); }
  }

  if (status === "done") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[rgba(30,122,90,0.12)] flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1E7A5A" strokeWidth="2.5"><path d="m5 13 4 4L19 7"/></svg>
        </div>
        <h3 className="text-[20px] font-extrabold text-[#0e1b4d]">Application submitted</h3>
        <p className="text-[14px] text-[#6b7280] mt-2 max-w-[46ch] mx-auto">Our partnerships team will review your details and begin verification. You'll hear from us within 3–5 business days.</p>
        <p className="text-[13px] text-[#6b7280] mt-3">Application ref: <span className="font-bold text-[#3056D3]">{ref}</span></p>
        {/* verification progress (placeholder flow) */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 text-[12px] font-semibold ${i === 0 ? "text-[#1E7A5A]" : "text-[#9ca3af]"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] ${i === 0 ? "bg-[#1E7A5A] text-white" : "bg-[#e5e7eb] text-[#6b7280]"}`}>{i === 0 ? "✓" : i + 1}</span>{s}
              </span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-[#d1d5db]" />}
            </div>
          ))}
        </div>
        <button onClick={() => { setV(init); setStatus("idle"); setRef(""); }}
          className="mt-6 inline-flex h-[44px] items-center px-6 rounded-full border border-[#3056D3] text-[#3056D3] text-[14px] font-bold">Submit another application</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <fieldset className="space-y-4">
        <legend className="text-[14px] font-bold text-[#0e1b4d] mb-1">Company details</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <TextField label="Company name" name="company" value={v.company} onChange={on} error={errors.company} required />
          <TextField label="Contact name" name="contactName" value={v.contactName} onChange={on} error={errors.contactName} required />
          <TextField label="Email" name="email" type="email" value={v.email} onChange={on} error={errors.email} required />
          <TextField label="Phone" name="phone" type="tel" value={v.phone} onChange={on} error={errors.phone} required placeholder="+91…" />
          <TextField label="GSTIN" name="gst" value={v.gst} onChange={on} error={errors.gst} placeholder="15-character GST number" />
          <TextField label="City" name="city" value={v.city} onChange={on} />
        </div>
        <TextField label="Website (optional)" name="website" value={v.website} onChange={on} placeholder="https://" />
      </fieldset>

      <fieldset>
        <legend className="text-[14px] font-bold text-[#0e1b4d] mb-2">Product categories you supply</legend>
        <ChipMulti label="" name="categories" value={v.categories} onChange={on} options={PRODUCT_CATEGORIES} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-[14px] font-bold text-[#0e1b4d] mb-1">Documents</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <FileField label="GST certificate" name="gstCertificate" value={v.gstCertificate} onChange={on} />
          <FileField label="Product catalogue" name="catalogue" value={v.catalogue} onChange={on} hint="PDF / XLSX" />
        </div>
        <TextArea label="Anything else?" name="notes" value={v.notes} onChange={on} rows={3} placeholder="Brands, certifications, manufacturing capacity…" />
      </fieldset>

      {serverErr && <p className="text-[13px] text-[#dc2626]">{serverErr}</p>}
      <button type="submit" disabled={status === "submitting"}
        className="inline-flex items-center justify-center h-[48px] w-full sm:w-auto px-8 rounded-full bg-[#3056D3] text-white text-[15px] font-bold disabled:opacity-60">
        {status === "submitting" ? "Submitting…" : "Submit supplier application"}
      </button>
    </form>
  );
}
