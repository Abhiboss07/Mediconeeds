import AccountShell from "@/components/AccountShell";
import { getAllProducts } from "@/lib/models";
export const metadata = { title: "Wishlist" };
export default function Page() {
  const items = getAllProducts().slice(0, 8);
  return (
    <AccountShell active="/account/wishlist" title="Wishlist">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-[12px] border border-[rgba(111,115,132,0.18)] overflow-hidden">
            <div className="aspect-square p-1.5"><img src={p.featuredImage.url} className="w-full h-full object-contain" /></div>
            <div className="px-2.5 pb-2.5">
              <div className="text-[12px] font-semibold text-[#0e1b4d] line-clamp-2 min-h-[32px] leading-snug">{p.title}</div>
              <div className="text-[13px] font-bold text-[#0e1b4d] mt-1">{p.formatted.price}</div>
              <a href={"/products/" + p.handle} className="block mt-2 text-center text-[12px] font-bold text-[#3056D3] border border-[#3056D3] rounded-full py-1.5">View</a>
            </div>
          </div>
        ))}
      </div>
    </AccountShell>
  );
}
