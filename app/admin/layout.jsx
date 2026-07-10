// Server layout for the admin console — supplies metadata for the client pages
// under /admin/* and keeps the console out of search indexes.
export const metadata = {
  title: { default: "Admin Console", template: "%s · Mediconeeds Admin" },
  description: "Mediconeeds admin console — approve sellers and products, manage the marketplace.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return children;
}
