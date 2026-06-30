import AccountShell from "@/components/AccountShell";
import { sampleOrders, getAllProducts, fmtINR } from "@/lib/models";

export const metadata = { title: "Account Dashboard" };

export default function Page() {
  const orders = sampleOrders();
  const wl = getAllProducts().slice(0, 4);
  const rec = getAllProducts().slice(4, 8);
  const stats = [
    { l: "Total Orders", v: orders.length },
    { l: "Wishlist", v: 6 },
    { l: "Addresses", v: 2 },
    { l: "Reward Points", v: 240 },
  ];
  const actions = [
    { l: "Continue Shopping", h: "/products" },
    { l: "Reorder Previous Purchase", h: "/account/orders" },
    { l: "Book a Consultation", h: "/consultation" },
    { l: "Refer & Earn", h: "/consultation" },
    { l: "Edit Profile", h: "/account/settings" },
    { l: "Help Center", h: "/faq" },
    { l: "Contact Us", h: "/contact" },
  ];
  return (
    <AccountShell active="/account" title="Dashboard">
      <div className="rounded-[14px] bg-gradient-to-r from-[#1F3580] to-[#3056D3] text-white p-5 mb-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[18px] font-extrabold">Welcome back 👋</div>
          <div className="text-[13px] opacity-90">You have {orders.length} orders and 240 reward points.</div>
        </div>
        <a href="/products" className="bg-white text-[#3056D3] text-[13px] font-bold rounded-full px-5 py-2.5">Shop New Arrivals</a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {stats.map((c) => (
          <div key={c.l} className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-4 text-center">
            <div className="text-[24px] font-extrabold text-[#3056D3]">{c.v}</div>
            <div className="text-[12px] text-[#6b7280] mt-0.5">{c.l}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-4 mb-4">
        <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-bold text-[#0e1b4d]">Recent Orders</h3>
            <a href="/account/orders" className="text-[13px] font-semibold text-[#3056D3]">View All</a>
          </div>
          {orders.map((o) => (
            <div key={o.id} className="flex items-center gap-3 py-2.5 border-t border-[#eef0f5]">
              <img src={o.image} className="w-11 h-11 rounded-[8px] object-contain border border-[#eef0f5]" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#0e1b4d] truncate">{o.title}</div>
                <div className="text-[12px] text-[#6b7280]">#{o.id} · {o.date}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-bold text-[#0e1b4d]">{fmtINR(o.total)}</div>
                <div className="text-[12px] text-[#006f5f]">{o.status}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-5">
            <h3 className="text-[15px] font-bold text-[#0e1b4d] mb-2">Quick Actions</h3>
            <div className="flex flex-col">
              {actions.map((a) => (
                <a key={a.l} href={a.h} className="text-[14px] text-[#0e1b4d] py-2 border-t border-[#eef0f5] hover:text-[#3056D3]">{a.l} →</a>
              ))}
            </div>
          </div>
          <div className="rounded-[14px] bg-[rgba(48,86,211,0.06)] border border-[rgba(48,86,211,0.18)] p-5 text-center">
            <div className="text-[12px] font-bold tracking-[0.1em] text-[#3056D3] uppercase">Reward Points</div>
            <div className="text-[34px] font-extrabold text-[#1F3580] my-1">240</div>
            <div className="text-[12px] text-[#6b7280]">Worth ₹240 off your next order</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold text-[#0e1b4d]">From your Wishlist</h3>
          <a href="/account/wishlist" className="text-[13px] font-semibold text-[#3056D3]">View All</a>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {wl.map((p) => (
            <a key={p.id} href={"/products/" + p.handle} className="rounded-[10px] border border-[#eef0f5] overflow-hidden">
              <div className="aspect-square p-2"><img src={p.featuredImage.url} className="w-full h-full object-contain" /></div>
              <div className="px-2.5 pb-2.5">
                <div className="text-[12px] font-semibold text-[#0e1b4d] line-clamp-1">{p.title}</div>
                <div className="text-[13px] font-bold text-[#0e1b4d]">{p.formatted.price}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-5">
        <h3 className="text-[15px] font-bold text-[#0e1b4d] mb-3">Recommended for you</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {rec.map((p) => (
            <a key={p.id} href={"/products/" + p.handle} className="rounded-[10px] border border-[#eef0f5] overflow-hidden">
              <div className="aspect-square p-2"><img src={p.featuredImage.url} className="w-full h-full object-contain" /></div>
              <div className="px-2.5 pb-2.5">
                <div className="text-[12px] font-semibold text-[#0e1b4d] line-clamp-1">{p.title}</div>
                <div className="text-[13px] font-bold text-[#0e1b4d]">{p.formatted.price}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </AccountShell>
  );
}
