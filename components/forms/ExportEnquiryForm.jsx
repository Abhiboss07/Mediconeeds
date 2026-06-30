"use client";
import { useState } from "react";
import { TextField, TextArea, SelectField } from "./FormKit";
import { validate, postJSON, COUNTRIES } from "@/lib/forms";

const schema = {
  name: { label: "Full name", required: true },
  email: { label: "Email", required: true, type: "email" },
  phone: { label: "Phone", type: "phone" },
  company: { label: "Company" },
  country: { label: "Destination country", required: true },
  products: { label: "Products of interest" },
  quantity: { label: "Estimated quantity" },
  message: { label: "Message", required: true },
};
const init = { name: "", email: "", phone: "", company: "", country: "", products: "", quantity: "", message: "" };

export default function ExportEnquiryForm() {
  const [v, setV] = useState(init);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle|submitting|done|error
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
      const r = await postJSON("/api/export-enquiry", v);
      setRef(r.ref); setStatus("done");
    } catch (err) { setServerErr(err.message); setStatus("error"); }
  }

  if (status === "done") {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-[rgba(30,122,90,0.12)] flex items-center justify-center mx-auto mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1E7A5A" strokeWidth="2.5"><path d="m5 13 4 4L19 7"/></svg>
        </div>
        <h3 className="text-[20px] font-extrabold text-[#0e1b4d]">Enquiry received</h3>
        <p className="text-[14px] text-[#6b7280] mt-2">Thanks — our export team will contact you within 1–2 business days.</p>
        <p className="text-[13px] text-[#6b7280] mt-3">Reference: <span className="font-bold text-[#3056D3]">{ref}</span></p>
        <button onClick={() => { setV(init); setStatus("idle"); setRef(""); }}
          className="mt-6 inline-flex h-[44px] items-center px-6 rounded-full border border-[#3056D3] text-[#3056D3] text-[14px] font-bold">Submit another enquiry</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <TextField label="Full name" name="name" value={v.name} onChange={on} error={errors.name} required />
        <TextField label="Email" name="email" type="email" value={v.email} onChange={on} error={errors.email} required />
        <TextField label="Phone" name="phone" type="tel" value={v.phone} onChange={on} error={errors.phone} placeholder="+91…" />
        <TextField label="Company" name="company" value={v.company} onChange={on} error={errors.company} />
        <SelectField label="Destination country" name="country" value={v.country} onChange={on} error={errors.country} options={COUNTRIES} required />
        <TextField label="Estimated quantity" name="quantity" value={v.quantity} onChange={on} placeholder="e.g. 500 units / month" />
      </div>
      <TextField label="Products of interest" name="products" value={v.products} onChange={on} placeholder="e.g. Sunscreen, Vitamin C Serum" />
      <TextArea label="Message" name="message" value={v.message} onChange={on} error={errors.message} required placeholder="Tell us about your market, volumes and timelines." />
      {serverErr && <p className="text-[13px] text-[#dc2626]">{serverErr}</p>}
      <button type="submit" disabled={status === "submitting"}
        className="inline-flex items-center justify-center h-[48px] w-full sm:w-auto px-8 rounded-full bg-[#3056D3] text-white text-[15px] font-bold disabled:opacity-60">
        {status === "submitting" ? "Sending…" : "Send export enquiry"}
      </button>
    </form>
  );
}
