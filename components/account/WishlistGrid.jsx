"use client";
import { useState } from "react";
import { fmtINR } from "@/lib/models";

export default function WishlistGrid({ initial = [] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState("");

  async function remove(handle) {
    setBusy(handle);
    try {
      const res = await fetch("/api/account/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handle, action: "remove" }),
      });
      if (res.ok) setItems((xs) => xs.filter((x) => x.handle !== handle));
    } finally {
      setBusy("");
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-[14px] border border-[rgba(111,115,132,0.18)] p-10 text-center">
        <div className="text-[15px] font-bold text-[#0e1b4d]">Your wishlist is empty</div>
        <p className="text-[13px] text-[#6b7280] mt-1">Tap the ♡ on any product to save it here for later.</p>
        <a href="/products" className="inline-block mt-4 text-[13px] font-bold text-white bg-[#3056D3] rounded-full px-5 py-2.5">Browse Products</a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((p) => (
        <div key={p.handle} className="bg-white rounded-[12px] border border-[rgba(111,115,132,0.18)] overflow-hidden">
          <div className="aspect-square p-1.5 relative">
            <img src={p.image} alt={p.title} className="w-full h-full object-contain" />
            <button
              onClick={() => remove(p.handle)}
              disabled={busy === p.handle}
              aria-label="Remove from wishlist"
              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white border border-[#eef0f5] text-[#cf5c2d] text-[14px] font-bold shadow-sm disabled:opacity-50"
            >×</button>
          </div>
          <div className="px-2.5 pb-2.5">
            <div className="text-[12px] font-semibold text-[#0e1b4d] line-clamp-2 min-h-[32px] leading-snug">{p.title}</div>
            <div className="text-[13px] font-bold text-[#0e1b4d] mt-1">{fmtINR(p.price)}</div>
            <a href={"/products/" + p.handle} className="block mt-2 text-center text-[12px] font-bold text-[#3056D3] border border-[#3056D3] rounded-full py-1.5">View</a>
          </div>
        </div>
      ))}
    </div>
  );
}
