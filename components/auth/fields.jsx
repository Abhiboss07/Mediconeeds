"use client";
// Controlled form primitives styled to match the approved AuthCard look.

export function AInput({ label, value, onChange, type = "text", placeholder, autoComplete, name, disabled }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">{label}</span>
      <input
        type={type} name={name} value={value} placeholder={placeholder} autoComplete={autoComplete} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-[42px] px-4 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3] bg-white disabled:bg-[#f6f7fb] disabled:text-[#9ca3af]"
      />
    </label>
  );
}

export function AButton({ children, onClick, type = "button", variant = "primary", disabled, loading }) {
  const styles = {
    primary: "bg-[#3056D3] text-white",
    outline: "bg-white text-[#3056D3] border border-[#3056D3]",
    dark: "bg-[#0e1b4d] text-white",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 h-[44px] px-6 rounded-full text-[15px] font-bold w-full disabled:opacity-60 ${styles}`}>
      {loading ? "Please wait…" : children}
    </button>
  );
}

export function Alert({ kind = "error", children }) {
  if (!children) return null;
  const tone = kind === "error"
    ? "bg-[#fdecec] text-[#b42318] border-[#f6cfca]"
    : "bg-[#e9f7ef] text-[#1a7f45] border-[#bfe6cd]";
  return <div className={`text-[13px] rounded-[10px] border px-3 py-2 ${tone}`} role="alert">{children}</div>;
}

export function Divider({ label = "OR" }) {
  return <div className="flex items-center gap-3 text-[12px] text-[#9ca3af]"><span className="h-px bg-[#e5e7eb] flex-1" />{label}<span className="h-px bg-[#e5e7eb] flex-1" /></div>;
}

/** 6-box OTP input with paste + auto-advance. */
export function OtpBoxes({ value, onChange }) {
  const set = (i, v) => {
    const digit = v.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[i] = digit;
    onChange(arr.join("").slice(0, 6));
    if (digit && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };
  const onPaste = (e) => {
    const t = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (t) { e.preventDefault(); onChange(t); document.getElementById(`otp-${Math.min(t.length, 5)}`)?.focus(); }
  };
  return (
    <div className="flex justify-center gap-2" onPaste={onPaste}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <input key={i} id={`otp-${i}`} inputMode="numeric" maxLength={1} value={value[i] || ""}
          onChange={(e) => set(i, e.target.value)}
          onKeyDown={(e) => { if (e.key === "Backspace" && !value[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus(); }}
          className="w-[44px] h-[52px] text-center text-[20px] font-bold rounded-[12px] border border-[rgba(111,115,132,0.4)] outline-none focus:border-[#3056D3]" />
      ))}
    </div>
  );
}

export function GoogleButton({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="inline-flex items-center justify-center gap-2 h-[44px] px-6 rounded-full text-[15px] font-bold w-full bg-white text-[#0e1b4d] border border-[rgba(111,115,132,0.4)]">
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.3C41.4 36 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"/></svg>
      Continue with Google
    </button>
  );
}
