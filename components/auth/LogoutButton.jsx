"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton({ className = "" }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className || "bg-white/15 hover:bg-white/25 text-white text-[13px] font-bold rounded-full px-5 py-2.5 border border-white/30"}
    >
      Log out
    </button>
  );
}
