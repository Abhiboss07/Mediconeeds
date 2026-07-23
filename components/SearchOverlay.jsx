"use client";

import { useEffect, useState } from "react";
import SearchField from "@/components/search/SearchField";

/**
 * Modal shell for the header search control. All of the actual search
 * behaviour — suggestions, trending, history, keyboard navigation, submit —
 * lives in <SearchField>, which the /search page renders too, so the two entry
 * points can never drift apart or stack two search bars on one screen.
 */
export default function SearchOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mn:open-search", onOpen);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("mn:open-search", onOpen); window.removeEventListener("keydown", onKey); };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40" onMouseDown={() => setOpen(false)}>
      <div
        className="mx-auto mt-0 bg-white w-full max-w-[760px] rounded-b-[20px] shadow-[0_20px_60px_rgba(14,27,77,0.25)] p-5"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <SearchField variant="overlay" autoFocus onDismiss={() => setOpen(false)} />
      </div>
    </div>
  );
}
