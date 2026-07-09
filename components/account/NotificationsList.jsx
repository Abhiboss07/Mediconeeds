"use client";
import { useEffect, useState } from "react";

export default function NotificationsList() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await (await fetch("/api/account/notifications")).json();
        if (r.ok) setNotes(r.notifications);
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <p className="text-[14px] text-[#6b7280]">Loading…</p>;

  if (notes.length === 0) {
    return (
      <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-8 text-center">
        <div className="text-[15px] font-semibold text-[#0e1b4d]">No notifications</div>
        <p className="text-[13px] text-[#6b7280] mt-1">You're all caught up.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] divide-y divide-[#eef0f5]">
      {notes.map((n) => (
        <div key={n.id} className={`flex items-start gap-3 p-4 ${n.read ? "" : "bg-[#f7f9ff]"}`}>
          <span className={`w-2 h-2 rounded-full mt-2 shrink-0 ${n.read ? "bg-[#d1d5db]" : "bg-[#3056D3]"}`} />
          <div className="min-w-0">
            <div className="text-[14px] text-[#0e1b4d] font-semibold">{n.title}</div>
            {n.body && <div className="text-[13px] text-[#6b7280] mt-0.5">{n.body}</div>}
            <div className="text-[12px] text-[#9ca3af] mt-0.5">{n.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
