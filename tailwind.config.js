/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan only the hand-written JSX pages/components. The cloned .html fragments
  // already carry their styling via the reused compiled CSS, so we don't scan
  // them here (avoids bloat / duplication).
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  // Preflight OFF — we must not reset the reused Medikabazaar/Dawn base styles.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: { navy: "#0e1b4d", blue: "#3056D3", indigo: "#1F3580", bg: "#eff0f5" },
      },
    },
  },
  plugins: [],
};
