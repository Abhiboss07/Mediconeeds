"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SearchField from "@/components/search/SearchField";

/**
 * Mounts the one live <SearchField> into whichever header slot is actually on
 * screen.
 *
 * SiteChrome renders the desktop and mobile chrome as two sibling trees, one of
 * which is display:none at any width. Rendering a field into both slots would
 * put two search inputs back into the DOM — the exact duplication this replaces
 * — so we resolve the breakpoint here and portal into a single slot, swapping
 * on resize.
 */
export default function HeaderSearchPortal({ desktopSlotId, mobileSlotId, breakpoint = 1024 }) {
  const [host, setHost] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const pick = () => setHost(document.getElementById(mq.matches ? desktopSlotId : mobileSlotId));
    pick();
    mq.addEventListener("change", pick);
    return () => mq.removeEventListener("change", pick);
  }, [desktopSlotId, mobileSlotId, breakpoint]);

  if (!host) return null;
  return createPortal(<SearchField variant="header" autoFocus />, host);
}
