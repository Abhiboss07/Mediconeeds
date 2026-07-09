// PWA / installability manifest (served at /manifest.webmanifest).
export default function manifest() {
  return {
    name: "Mediconeeds — Dr Awish Skincare",
    short_name: "Mediconeeds",
    description: "Dermatologist-formulated skincare & B2B medical marketplace.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7FAFF",
    theme_color: "#3056D3",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
