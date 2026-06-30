"use client";
// Controlled form primitives (Mediconeeds styling) with name/required/error support.
// Used by ExportEnquiryForm and SupplierForm.

const baseInput =
  "w-full h-[44px] px-4 rounded-[10px] border text-[14px] outline-none bg-white transition-colors";
const ring = (err) =>
  err ? "border-[#dc2626] focus:border-[#dc2626]" : "border-[rgba(111,115,132,0.4)] focus:border-[#3056D3]";

function Label({ label, required, htmlFor }) {
  return (
    <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">
      {label} {required && <span className="text-[#dc2626]">*</span>}
    </span>
  );
}
function Err({ error }) {
  return error ? <span className="block text-[12px] text-[#dc2626] mt-1">{error}</span> : null;
}

export function TextField({ label, name, value, onChange, error, required, type = "text", placeholder }) {
  return (
    <label className="block">
      <Label label={label} required={required} />
      <input
        type={type} name={name} value={value} placeholder={placeholder} required={required}
        onChange={(e) => onChange(name, e.target.value)}
        className={`${baseInput} ${ring(error)}`}
      />
      <Err error={error} />
    </label>
  );
}

export function TextArea({ label, name, value, onChange, error, required, placeholder, rows = 4 }) {
  return (
    <label className="block">
      <Label label={label} required={required} />
      <textarea
        name={name} value={value} placeholder={placeholder} required={required} rows={rows}
        onChange={(e) => onChange(name, e.target.value)}
        className={`w-full px-4 py-3 rounded-[10px] border text-[14px] outline-none bg-white transition-colors ${ring(error)}`}
      />
      <Err error={error} />
    </label>
  );
}

export function SelectField({ label, name, value, onChange, error, required, options, placeholder = "Select…" }) {
  return (
    <label className="block">
      <Label label={label} required={required} />
      <select
        name={name} value={value} required={required}
        onChange={(e) => onChange(name, e.target.value)}
        className={`${baseInput} ${ring(error)} ${value ? "text-[#0e1b4d]" : "text-[#9ca3af]"}`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o} className="text-[#0e1b4d]">{o}</option>)}
      </select>
      <Err error={error} />
    </label>
  );
}

// Multi-select chips (e.g. product categories of interest).
export function ChipMulti({ label, name, value = [], onChange, options, error }) {
  const toggle = (o) =>
    onChange(name, value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="block">
      <Label label={label} />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              type="button" key={o} onClick={() => toggle(o)}
              className={`px-3 h-[34px] rounded-full text-[13px] font-semibold border transition-colors ${
                on ? "bg-[#3056D3] text-white border-[#3056D3]" : "bg-white text-[#3056D3] border-[rgba(48,86,211,0.4)] hover:bg-[rgba(48,86,211,0.06)]"
              }`}
            >{o}</button>
          );
        })}
      </div>
      <Err error={error} />
    </div>
  );
}

// Document upload placeholder — captures file name only (no real upload yet).
// Backend-ready: swap onChange to push to a presigned-URL upload when available.
export function FileField({ label, name, value, onChange, hint }) {
  return (
    <label className="block">
      <Label label={label} />
      <div className="flex items-center gap-3 w-full px-4 h-[44px] rounded-[10px] border border-dashed border-[rgba(48,86,211,0.5)] bg-[rgba(48,86,211,0.03)] cursor-pointer">
        <span className="text-[13px] font-semibold text-[#3056D3]">Choose file</span>
        <span className="text-[13px] text-[#6b7280] truncate">{value || hint || "PDF / JPG / PNG"}</span>
        <input
          type="file" name={name} className="hidden"
          onChange={(e) => onChange(name, e.target.files?.[0]?.name || "")}
        />
      </div>
    </label>
  );
}
