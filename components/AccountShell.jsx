import SiteChrome from "@/components/SiteChrome";

const NAV = [
  { label: "Dashboard", href: "/account" },
  { label: "My Orders", href: "/account/orders" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "Saved Addresses", href: "/account/addresses" },
  { label: "Notifications", href: "/account/notifications" },
  { label: "Account Settings", href: "/account/settings" },
];

export default function AccountShell({ active, title, children }) {
  const content = (
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-6 lg:py-10">
      <h1 className="text-[24px] lg:text-[30px] font-extrabold text-[#0e1b4d] mb-6">My Account</h1>
      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="bg-white rounded-[16px] border border-[rgba(111,115,132,0.18)] p-3 h-fit">
          <div className="flex items-center gap-3 p-3 mb-2 border-b border-[#eef0f5]">
            <div className="w-10 h-10 rounded-full bg-[rgba(48,86,211,0.12)] flex items-center justify-center font-bold text-[#3056D3]">A</div>
            <div>
              <div className="text-[14px] font-bold text-[#0e1b4d]">Welcome back</div>
              <div className="text-[12px] text-[#6b7280]">Mediconeeds Member</div>
            </div>
          </div>
          <nav className="flex flex-col">
            {NAV.map((n) => (
              <a key={n.href} href={n.href}
                className={`px-4 py-3 rounded-[10px] text-[14px] font-semibold ${active === n.href ? "bg-[rgba(48,86,211,0.10)] text-[#3056D3]" : "text-[#0e1b4d] hover:bg-[#f5f6fb]"}`}>
                {n.label}
              </a>
            ))}
            <a href="/login" className="px-4 py-3 rounded-[10px] text-[14px] font-semibold text-[#cf5c2d] hover:bg-[#fdf3ee]">Log Out</a>
          </nav>
        </aside>
        <section className="min-w-0">
          {title && <h2 className="text-[20px] font-extrabold text-[#0e1b4d] mb-4">{title}</h2>}
          {children}
        </section>
      </div>
    </div>
  );
  return <SiteChrome content={content} />;
}
