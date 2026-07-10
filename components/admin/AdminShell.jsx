"use client";
import { useState } from "react";

const NAV = [
  { label: "Overview", href: "/admin", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { label: "Sellers", href: "/admin/sellers", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8" },
  { label: "Products", href: "/admin/products", icon: "M4 7l8-4 8 4-8 4-8-4zm0 0v10l8 4 8-4V7" },
  { label: "Orders", href: "/admin/orders", icon: "M6 2l1.5 3h9L18 2M3 6h18l-1.5 13.5A2 2 0 0116.5 21h-9A2 2 0 016 19.5L3 6z" },
];

function Icon({ d }) { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>; }

export default function AdminShell({ active, title, subtitle, children }) {
  const [open, setOpen] = useState(false);
  const Aside = (
    <div className="flex flex-col h-full bg-[#0f1424] text-white w-[240px]">
      <a href="/" className="flex items-center gap-2 px-5 h-[60px] shrink-0 border-b border-white/10">
        <span className="text-[18px] font-extrabold tracking-tight"><span className="text-white">Medico</span><span className="text-[#7f9cff]">needs</span></span>
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase bg-[#e0633a] rounded px-1.5 py-0.5">Admin</span>
      </a>
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] font-semibold ${active === n.href ? "bg-[#3056D3] text-white" : "text-[#cfd6ea] hover:bg-white/10"}`}><Icon d={n.icon} />{n.label}</a>
        ))}
        <div className="mt-2 pt-2 border-t border-white/10 text-[11px] uppercase tracking-wide text-white/40 px-3 py-2">Manage</div>
        {["Categories", "Brands", "Banners", "Commission"].map((x) => (
          <span key={x} className="flex items-center justify-between px-3 py-2.5 rounded-[10px] text-[13.5px] font-semibold text-[#8b93ad]">{x}<span className="text-[10px] bg-white/10 rounded px-1.5 py-0.5">Soon</span></span>
        ))}
      </nav>
      <div className="px-3 pb-4 border-t border-white/10">
        <a href="/seller/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] font-semibold text-[#cfd6ea] hover:bg-white/10"><Icon d="M3 12h13M12 5l7 7-7 7" />Seller portal</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40">{Aside}</aside>
      {open && <div className="lg:hidden fixed inset-0 z-50"><div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} /><div className="absolute inset-y-0 left-0">{Aside}</div></div>}
      <div className="flex-1 lg:ml-[240px] min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 bg-white border-b border-[rgba(111,115,132,0.16)] h-[60px] flex items-center gap-3 px-4 lg:px-7">
          <button onClick={() => setOpen(true)} className="lg:hidden" aria-label="Menu"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg></button>
          <div className="min-w-0 flex-1"><h1 className="text-[16px] lg:text-[19px] font-extrabold text-[#0e1b4d] truncate">{title}</h1>{subtitle && <p className="text-[12px] text-[#6b7280] truncate hidden sm:block">{subtitle}</p>}</div>
          <span className="w-9 h-9 rounded-full bg-[#0f1424] text-white font-bold flex items-center justify-center text-[13px]">AD</span>
        </header>
        <main className="p-4 lg:p-7 flex-1">{children}</main>
      </div>
    </div>
  );
}
