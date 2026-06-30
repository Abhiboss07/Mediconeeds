import SiteChrome from "@/components/SiteChrome";
import { getAllProducts } from "@/lib/models";
import { concerns, ingredients } from "@/lib/catalog";
export const metadata = { title: "Search" };
export default function Page(){
  const trending=["Vitamin C Serum","SPF 50 Sunscreen","Glow Care Combo","Niacinamide","Retinol Serum","Anti-Dandruff Shampoo"];
  const items=getAllProducts().slice(0,10);
  const content=(
    <div className="max-w-[84rem] mx-auto px-4 lg:px-8 py-6 lg:py-10">
      <div className="flex items-center h-[48px] px-4 rounded-full border border-[rgba(111,115,132,0.4)] bg-white max-w-[640px]"><span className="text-[#64748B] mr-2">🔍</span><input placeholder="Search for serums, sunscreen, ingredients…" className="flex-1 outline-none text-[15px]"/></div>
      <div className="mt-6 grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-6">
          <div><h3 className="text-[13px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-2">Trending</h3><div className="flex flex-wrap gap-2">{trending.map(t=>(<a key={t} href="#" className="text-[13px] bg-[#f5f6fb] rounded-full px-3 py-1.5 text-[#0e1b4d]">{t}</a>))}</div></div>
          <div><h3 className="text-[13px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-2">Shop by Concern</h3><div className="flex flex-wrap gap-2">{concerns.map(t=>(<a key={t} href="#" className="text-[13px] bg-[#f5f6fb] rounded-full px-3 py-1.5 text-[#0e1b4d]">{t}</a>))}</div></div>
          <div><h3 className="text-[13px] font-bold tracking-[0.1em] text-[#3056D3] uppercase mb-2">By Ingredient</h3><div className="flex flex-wrap gap-2">{ingredients.map(t=>(<a key={t.handle} href="#" className="text-[13px] bg-[#f5f6fb] rounded-full px-3 py-1.5 text-[#0e1b4d]">{t.name}</a>))}</div></div>
        </aside>
        <div><h3 className="text-[16px] font-bold text-[#0e1b4d] mb-3">Popular products</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{items.map(p=>(<a key={p.id} href={"/products/"+p.handle} className="bg-white rounded-[12px] border border-[rgba(111,115,132,0.18)] overflow-hidden"><div className="aspect-square p-2"><img src={p.featuredImage.url} className="w-full h-full object-contain"/></div><div className="px-3 pb-3"><div className="text-[12px] font-semibold text-[#0e1b4d] line-clamp-2 min-h-[32px]">{p.title}</div><div className="text-[14px] font-bold text-[#0e1b4d] mt-1">{p.formatted.price}</div></div></a>))}</div>
        </div>
      </div>
    </div>);
  return <SiteChrome content={content}/>;
}
