"use client";
// Shared seller-portal UI primitives: stat cards, badges, section cards and
// dependency-free SVG charts (bar / line / donut). Kept small and reusable.

const TONES = {
  gray: "bg-[#eef0f5] text-[#4b5563]",
  green: "bg-[#e6f4ee] text-[#1E7A5A]",
  amber: "bg-[#fdf0dd] text-[#b7791f]",
  red: "bg-[#fdecec] text-[#d23f3f]",
  blue: "bg-[#eef2ff] text-[#3056D3]",
  indigo: "bg-[#e8ebff] text-[#4053c4]",
  violet: "bg-[#f0e9fd] text-[#7c3aed]",
};

export function Badge({ tone = "gray", children }) {
  return <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-0.5 rounded-full ${TONES[tone] || TONES.gray}`}>{children}</span>;
}

export function SectionCard({ title, action, children, className = "" }) {
  return (
    <div className={`rounded-[16px] border border-[rgba(111,115,132,0.16)] bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#eef0f5]">
          <h3 className="text-[15px] font-extrabold text-[#0e1b4d]">{title}</h3>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatCard({ label, value, sub, tone = "blue", icon }) {
  return (
    <div className="rounded-[16px] border border-[rgba(111,115,132,0.16)] bg-white p-4 lg:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-semibold text-[#6b7280]">{label}</p>
          <p className="text-[22px] lg:text-[26px] font-extrabold text-[#0e1b4d] mt-1 leading-none">{value}</p>
          {sub && <p className="text-[12px] mt-1.5 text-[#6b7280]">{sub}</p>}
        </div>
        <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${TONES[tone]}`}>{icon || "•"}</span>
      </div>
    </div>
  );
}

// ---- Charts (pure SVG, no deps) ----
export function BarChart({ data, height = 160, format = (v) => v }) {
  const max = Math.max(...data.map((d) => d.val), 1);
  const bw = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height / 2}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.val / max) * (height / 2 - 14);
        return (
          <g key={d.m || i}>
            <rect x={i * bw + bw * 0.22} y={height / 2 - 10 - h} width={bw * 0.56} height={h} rx="1.2" fill="#3056D3" />
            <text x={i * bw + bw / 2} y={height / 2 - 2} textAnchor="middle" fontSize="3.4" fill="#9ca3af">{d.m || d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ data, height = 160 }) {
  const max = Math.max(...data.map((d) => d.val), 1);
  const min = Math.min(...data.map((d) => d.val));
  const span = max - min || 1;
  const W = 100, H = height / 2;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - 8 - ((d.val - min) / span) * (H - 18);
    return [x, y];
  });
  const path = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = path + ` L ${W} ${H - 8} L 0 ${H - 8} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <path d={area} fill="rgba(48,86,211,0.10)" />
      <path d={path} fill="none" stroke="#3056D3" strokeWidth="1.2" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="1.1" fill="#3056D3" />)}
      {data.map((d, i) => <text key={i} x={(i / (data.length - 1)) * W} y={H - 1} textAnchor="middle" fontSize="3.4" fill="#9ca3af">{d.m}</text>)}
    </svg>
  );
}

export function Donut({ segments, size = 132 }) {
  const colors = ["#3056D3", "#1E7A5A", "#e0633a", "#7c3aed", "#b7791f"];
  const total = segments.reduce((a, s) => a + s.pct, 0) || 1;
  const r = 52, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 132 132" className="shrink-0 -rotate-90">
        <circle cx="66" cy="66" r={r} fill="none" stroke="#eef0f5" strokeWidth="14" />
        {segments.map((s, i) => {
          const len = (s.pct / total) * C;
          const el = <circle key={i} cx="66" cy="66" r={r} fill="none" stroke={colors[i % colors.length]} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[13px]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />
            <span className="text-[#0e1b4d] font-semibold">{s.name}</span>
            <span className="text-[#6b7280]">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
