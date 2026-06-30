import React from "react";

// Parse an inline style string ("a:b;c:d") into a React style object.
function styleObj(str) {
  if (!str) return undefined;
  const out = {};
  for (const decl of str.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!prop) continue;
    const key = prop.startsWith("--")
      ? prop
      : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    out[key] = val;
  }
  return out;
}

/**
 * Renders a captured section as its EXACT original root element
 * (tag + class + id + style) with the original inner HTML injected.
 * No extra wrapper nodes, so flex/grid/gap relationships stay identical.
 */
export default function Frag({ item, html, className }) {
  const tag = item?.tag || "div";
  const props = {
    className: [item?.class, className].filter(Boolean).join(" ") || undefined,
    id: item?.id || undefined,
    style: styleObj(item?.style),
    dangerouslySetInnerHTML: { __html: html },
  };
  return React.createElement(tag, props);
}
