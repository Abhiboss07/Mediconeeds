"use client";
import { useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { useSellerStore, markAllRead, toggleRead } from "@/lib/seller/store";

const META = {
  order: { tone: "bg-[#eef2ff] text-[#3056D3]", icon: "M3 6h18l-1.5 13.5H4.5z" },
  stock: { tone: "bg-[#fdf0dd] text-[#b7791f]", icon: "M3 7h18v13H3zM9 12h6" },
  approval: { tone: "bg-[#e6f4ee] text-[#1E7A5A]", icon: "M5 12l5 5L20 6" },
  rejected: { tone: "bg-[#fdecec] text-[#d23f3f]", icon: "M18 6L6 18M6 6l12 12" },
  message: { tone: "bg-[#f0e9fd] text-[#7c3aed]", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  announcement: { tone: "bg-[#e8ebff] text-[#4053c4]", icon: "M3 11l18-5v12L3 14v-3zM11 18v3" },
};
const FILTERS = [["all", "All"], ["order", "Orders"], ["stock", "Stock"], ["approval", "Approvals"], ["rejected", "Rejected"], ["message", "Messages"], ["announcement", "Announcements"]];

export default function Page() {
  const s = useSellerStore();
  const [filter, setFilter] = useState("all");
  const list = s.notifications.filter((n) => filter === "all" || n.type === filter);
  const unread = s.notifications.filter((n) => !n.read).length;

  return (
    <SellerShell active="/seller/notifications" title="Notifications" subtitle={`${unread} unread`}
      actions={<button onClick={markAllRead} className="h-[38px] px-4 rounded-full border border-[rgba(48,86,211,0.3)] text-[13px] font-semibold text-[#3056D3]">Mark all read</button>}>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} className={`h-[34px] px-3.5 rounded-full text-[13px] font-semibold ${filter === k ? "bg-[#3056D3] text-white" : "bg-white border border-[rgba(111,115,132,0.3)] text-[#0e1b4d]"}`}>{label}</button>
        ))}
      </div>

      <div className="rounded-[16px] border border-[rgba(111,115,132,0.16)] bg-white divide-y divide-[#eef0f5]">
        {list.map((n) => {
          const m = META[n.type] || META.announcement;
          return (
            <div key={n.id} className={`flex items-start gap-3 p-4 ${n.read ? "" : "bg-[#f7f9ff]"}`}>
              <span className={`w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ${m.tone}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={m.icon} /></svg></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2"><span className="text-[14px] font-bold text-[#0e1b4d]">{n.title}</span>{!n.read && <span className="w-2 h-2 rounded-full bg-[#3056D3]" />}</div>
                <p className="text-[13px] text-[#6b7280] mt-0.5">{n.body}</p>
                <span className="text-[11px] text-[#9ca3af]">{n.time}</span>
              </div>
              <button onClick={() => toggleRead(n.id)} className="text-[12px] font-semibold text-[#3056D3] shrink-0">{n.read ? "Mark unread" : "Mark read"}</button>
            </div>
          );
        })}
        {list.length === 0 && <div className="p-10 text-center text-[#6b7280]">No notifications here.</div>}
      </div>
    </SellerShell>
  );
}
