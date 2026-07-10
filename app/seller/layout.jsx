// Server layout for the seller portal — supplies metadata for the client pages
// under /seller/* (which can't export it themselves) and a shared title template.
export const metadata = {
  title: { default: "Seller Portal", template: "%s · Mediconeeds Seller" },
  description: "Mediconeeds seller portal — manage products, orders, inventory, analytics and settlements.",
  robots: { index: false, follow: false }, // portal is not for search indexing
};

export default function SellerLayout({ children }) {
  return children;
}
