"use client";

import { useEffect, useRef, useState } from "react";

// The live "All Categories" mega menu is rendered client-side by the original
// app and was not present in the saved DOM, so this is a faithful, on-brand
// reconstruction from the site's known category taxonomy.
const CATEGORIES = [
  "Sunscreen",
  "Serum",
  "Cleanser",
  "Moisturiser",
  "Face Cream",
  "Hair Care",
  "Acne Care",
  "Anti-Ageing",
  "Pigmentation",
  "Lip Care",
  "Body Care",
  "Under Eye",
];

export default function MegaMenu() {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ left: 8, top: 60 });
  const panelRef = useRef(null);

  useEffect(() => {
    // locate the "All Categories" button inside the (raw HTML) header
    const btn = Array.from(document.querySelectorAll("header button")).find((b) =>
      b.textContent.trim().startsWith("All Categories")
    );
    if (!btn) return;

    const place = () => {
      const r = btn.getBoundingClientRect();
      setAnchor({ left: r.left, top: r.bottom + 6 });
    };
    const toggle = (e) => {
      e.preventDefault();
      place();
      setOpen((v) => !v);
    };
    btn.addEventListener("click", toggle);

    const onDoc = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        !btn.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", () => setOpen(false));

    return () => {
      btn.removeEventListener("click", toggle);
      document.removeEventListener("mousedown", onDoc);
    };
  }, []);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        left: anchor.left,
        top: anchor.top,
        zIndex: 60,
        width: 540,
        maxWidth: "92vw",
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 12px 40px rgba(0,0,0,0.16)",
        border: "1px solid rgba(31,53,128,0.12)",
        padding: 18,
      }}
    >
      <p
        style={{
          fontWeight: 700,
          fontSize: 13,
          color: "#1F3580",
          margin: "0 0 12px",
          letterSpacing: ".04em",
        }}
      >
        ALL CATEGORIES
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px 18px",
        }}
      >
        {CATEGORIES.map((c) => (
          <a
            key={c}
            href={"/products?category=" + encodeURIComponent(c.toLowerCase().replace(/\s+/g, "-"))}
            style={{
              display: "block",
              padding: "9px 10px",
              borderRadius: 9,
              fontSize: 14,
              fontWeight: 600,
              color: "#191D23",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(48,86,211,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {c}
          </a>
        ))}
      </div>
    </div>
  );
}
