"use client";
import { useState } from "react";
import { useSellerStore, useHydrateSeller } from "@/lib/seller/store";

const NAV = [
  { label: "Dashboard", href: "/seller/dashboard", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { label: "Products", href: "/seller/products", icon: "M4 7l8-4 8 4-8 4-8-4zm0 0v10l8 4 8-4V7" },
  { label: "Add Product", href: "/seller/products/new", icon: "M12 5v14M5 12h14" },
  { label: "Orders", href: "/seller/orders", icon: "M6 2l1.5 3h9L18 2M3 6h18l-1.5 13.5A2 2 0 0117.5 21h-11A2 2 0 014.5 19.5L3 6z" },
  { label: "Inventory", href: "/seller/inventory", icon: "M3 7h18v13H3zM3 7l2-4h14l2 4M9 12h6" },
  { label: "Analytics", href: "/seller/analytics", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  { label: "Wallet", href: "/seller/wallet", icon: "M3 7h18v12H3zM16 12h3M3 7l2-3h12l2 3" },
  { label: "Notifications", href: "/seller/notifications", icon: "M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9M10 21h4" },
  { label: "Support", href: "/seller/support", icon: "M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9a2.5 2.5 0 015 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01" },
];

function Icon({ d }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export default function SellerShell({ active, title, subtitle, actions, children }) {
  const [open, setOpen] = useState(false);
  useHydrateSeller(); // load real products + orders from the API on mount
  const s = useSellerStore();
  const seller = s.seller;
  const unread = s.notifications.filter((n) => !n.read).length;

  const SideNav = (
    <nav className="flex flex-col gap-0.5 px-3">
      {NAV.map((n) => (
        <a key={n.href} href={n.href} onClick={() => setOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] font-semibold transition-colors ${active === n.href ? "bg-[#3056D3] text-white" : "text-[#cfd6ea] hover:bg-white/10"}`}>
          <Icon d={n.icon} />
          <span className="flex-1">{n.label}</span>
          {n.href === "/seller/notifications" && unread > 0 && (
            <span className="text-[10px] font-bold bg-[#e0633a] text-white rounded-full min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center">{unread}</span>
          )}
        </a>
      ))}
    </nav>
  );

  const Aside = (
    <div className="flex flex-col h-full bg-[#141b3a] text-white w-[248px]">
      <a href="/" className="flex items-center gap-2 px-5 h-[60px] shrink-0 border-b border-white/10">
        <span className="text-[19px] font-extrabold tracking-tight"><span className="text-white">Medico</span><span className="text-[#7f9cff]">needs</span></span>
        <span className="text-[10px] font-bold tracking-[0.12em] uppercase bg-white/15 rounded px-1.5 py-0.5">Seller</span>
      </a>
      <div className="py-4 flex-1 overflow-y-auto">{SideNav}</div>
      <div className="px-3 pb-4 pt-2 border-t border-white/10 space-y-0.5">
        <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] font-semibold text-[#cfd6ea] hover:bg-white/10"><Icon d="M3 12h13M12 5l7 7-7 7M21 4v16" />View storefront</a>
        <a href="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] font-semibold text-[#f0a58c] hover:bg-white/10"><Icon d="M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />Log out</a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex">
      {/* desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 z-40">{Aside}</aside>

      {/* mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0">{Aside}</div>
        </div>
      )}

      <div className="flex-1 lg:ml-[248px] min-w-0 flex flex-col">
        {/* topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-[rgba(111,115,132,0.16)] h-[60px] flex items-center gap-3 px-4 lg:px-7">
          <button onClick={() => setOpen(true)} className="lg:hidden text-[#0e1b4d]" aria-label="Open menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-[16px] lg:text-[19px] font-extrabold text-[#0e1b4d] truncate">{title}</h1>
            {subtitle && <p className="text-[12px] text-[#6b7280] truncate hidden sm:block">{subtitle}</p>}
          </div>
          {actions}
          <a href="/seller/notifications" className="relative w-9 h-9 rounded-full bg-[#f5f7fb] flex items-center justify-center text-[#0e1b4d]" aria-label="Notifications">
            <Icon d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9M10 21h4" />
            {unread > 0 && <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-[#e0633a] text-white rounded-full min-w-[17px] h-[17px] px-1 inline-flex items-center justify-center">{unread}</span>}
          </a>
          <div className="flex items-center gap-2 pl-1">
            <span className="w-9 h-9 rounded-full bg-[#3056D3] text-white font-bold flex items-center justify-center text-[13px]">{seller.avatar}</span>
            <div className="hidden md:block leading-tight">
              <div className="text-[13px] font-bold text-[#0e1b4d] max-w-[150px] truncate">{seller.company}</div>
              <div className="text-[11px] text-[#1E7A5A] font-semibold">● {seller.status === "approved" ? "Verified seller" : seller.status}</div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-7 flex-1">{children}</main>
      </div>
    </div>
  );
}
