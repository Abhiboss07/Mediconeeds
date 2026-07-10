"use client";
// Scroll-reveal wrapper. Hydration-safe: the initial render is identical on
// server and client (always starts in the "pending" state), then an
// IntersectionObserver reveals it once in view. Falls back to visible when the
// observer is unavailable, and respects prefers-reduced-motion (see polish.css).
import { useRef, useEffect, useState } from "react";

export default function Reveal({ children, className = "", delay = 0, as: Tag = "div" }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`mn-reveal${shown ? " mn-reveal-in" : ""}${className ? " " + className : ""}`}>
      {children}
    </Tag>
  );
}
