// Shared UI primitives (Mediconeeds styling) used by auth/account/cart/policy pages.
export function Field({ label, type = "text", placeholder, defaultValue }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full h-[42px] px-4 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3] bg-white"
      />
    </label>
  );
}

export function Btn({ children, variant = "primary", as = "button", href }) {
  const base = "inline-flex items-center justify-center gap-2 h-[44px] px-6 rounded-full text-[15px] font-bold w-full";
  const styles = {
    primary: "bg-[#3056D3] text-white",
    outline: "bg-white text-[#3056D3] border border-[#3056D3]",
    dark: "bg-[#0e1b4d] text-white",
  }[variant];
  if (as === "a") return <a href={href} className={`${base} ${styles}`}>{children}</a>;
  return <button type="button" className={`${base} ${styles}`}>{children}</button>;
}

export function AuthCard({ title, sub, children, footer }) {
  return (
    <div className="flex items-start justify-center px-4 py-8 lg:py-10">
      <div className="w-full max-w-[440px] bg-white rounded-[18px] border border-[rgba(31,53,128,0.12)] shadow-[0_10px_34px_rgba(14,27,77,0.10)] p-6 lg:p-7">
        <div className="flex items-center justify-center gap-1 text-[22px] font-extrabold tracking-tight leading-none mb-4">
          <span style={{ color: "#1F3580" }}>Medico</span><span style={{ color: "#3056D3" }}>needs</span>
        </div>
        <h1 className="text-[20px] font-extrabold text-[#0e1b4d] text-center">{title}</h1>
        {sub && <p className="text-[13px] text-[#6b7280] text-center mt-1">{sub}</p>}
        <div className="mt-5 space-y-3">{children}</div>
        {footer && <div className="mt-5 text-center text-[13px] text-[#6b7280]">{footer}</div>}
      </div>
    </div>
  );
}

export function PolicyPage({ title, intro, sections }) {
  return (
    <div className="max-w-[52rem] mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <h1 className="text-[28px] lg:text-[36px] font-extrabold text-[#0e1b4d]">{title}</h1>
      {intro && <p className="text-[15px] text-[#6b7280] mt-3 mb-8">{intro}</p>}
      <div className="space-y-7">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-[18px] font-bold text-[#0e1b4d] mb-2">{s.h}</h2>
            {s.p.map((para, j) => (
              <p key={j} className="text-[14px] leading-relaxed text-[#444] mb-2">{para}</p>
            ))}
          </section>
        ))}
      </div>
      <p className="text-[12px] text-[#9ca3af] mt-10">Last updated: June 2026 · Mediconeeds (Dr Awish Clinic)</p>
    </div>
  );
}
