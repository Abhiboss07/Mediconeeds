"use client";
import { useMemo, useState } from "react";
import SellerShell from "@/components/seller/SellerShell";
import { Badge } from "@/components/seller/ui";
import { useSellerStore, setProductStatus, deleteProduct, duplicateProduct } from "@/lib/seller/store";
import { inr, PRODUCT_STATUS } from "@/lib/seller/models";

const PAGE = 8;

export default function Page() {
  const s = useSellerStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [cat, setCat] = useState("all");
  const [page, setPage] = useState(1);
  const [sel, setSel] = useState([]);

  const cats = [...new Set(s.products.map((p) => p.category))];

  const filtered = useMemo(() => {
    return s.products.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (cat !== "all" && p.category !== cat) return false;
      if (q.trim() && !(p.name + " " + p.sku).toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [s.products, q, status, cat]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages);
  const rows = filtered.slice((cur - 1) * PAGE, cur * PAGE);
  const toggleSel = (id) => setSel((x) => (x.includes(id) ? x.filter((i) => i !== id) : [...x, id]));

  const exportCsv = () => {
    const head = ["id", "name", "sku", "category", "mrp", "price", "stock", "status", "views", "sales"];
    const lines = [head.join(",")].concat(
      filtered.map((p) => head.map((k) => `"${String(p[k]).replace(/"/g, '""')}"`).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mediconeeds-products.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const bulk = (fn) => { sel.forEach(fn); setSel([]); };

  const Actions = (
    <div className="hidden sm:flex items-center gap-2">
      <a href="/seller/products/bulk" className="h-[38px] px-3.5 rounded-full border border-[rgba(48,86,211,0.3)] text-[13px] font-semibold text-[#3056D3] inline-flex items-center">Bulk Upload</a>
      <button onClick={exportCsv} className="h-[38px] px-3.5 rounded-full border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold text-[#0e1b4d]">Export CSV</button>
      <a href="/seller/products/new" className="h-[38px] px-4 rounded-full bg-[#3056D3] text-white text-[13px] font-bold inline-flex items-center">+ Add Product</a>
    </div>
  );

  return (
    <SellerShell active="/seller/products" title="Products" subtitle={`${s.products.length} listings`} actions={Actions}>
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search products or SKU…" className="w-full h-[42px] pl-9 pr-4 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3] bg-white" />
        </div>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-[42px] px-3 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold bg-white text-[#0e1b4d]">
          <option value="all">All status</option>
          {Object.entries(PRODUCT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} className="h-[42px] px-3 rounded-[10px] border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold bg-white text-[#0e1b4d]">
          <option value="all">All categories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {sel.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2.5 rounded-[10px] bg-[#eef2ff]">
          <span className="text-[13px] font-semibold text-[#3056D3]">{sel.length} selected</span>
          <button onClick={() => bulk((id) => setProductStatus(id, "archived"))} className="text-[13px] font-semibold text-[#0e1b4d]">Archive</button>
          <button onClick={() => bulk((id) => deleteProduct(id))} className="text-[13px] font-semibold text-[#d23f3f]">Delete</button>
        </div>
      )}

      <div className="rounded-[16px] border border-[rgba(111,115,132,0.16)] bg-white overflow-hidden">
        <div className="overflow-x-auto mc-rtable-wrap">
          <table className="w-full text-[13px] min-w-[820px] mc-rtable">
            <thead>
              <tr className="text-[#6b7280] text-left bg-[#fafbff] border-b border-[#eef0f5]">
                <th className="p-3 w-8"></th>
                <th className="p-3 font-semibold">Product</th>
                <th className="p-3 font-semibold">SKU</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold">Stock</th>
                <th className="p-3 font-semibold">Views</th>
                <th className="p-3 font-semibold">Sales</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-[#f5f6fa] last:border-0 hover:bg-[#fafbff]">
                  <td className="p-3" data-label=""><input type="checkbox" checked={sel.includes(p.id)} onChange={() => toggleSel(p.id)} className="w-[15px] h-[15px] accent-[#3056D3]" /></td>
                  <td className="p-3" data-label="">
                    <div className="flex items-center gap-2.5">
                      <img src={p.image} alt="" className="w-9 h-9 rounded-[8px] object-contain border border-[#eef0f5] bg-white shrink-0" />
                      <span className="font-semibold text-[#0e1b4d] max-w-[200px] truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-[#6b7280]" data-label="SKU">{p.sku}</td>
                  <td className="p-3 text-[#374151]" data-label="Category">{p.category}</td>
                  <td className="p-3 font-semibold text-[#0e1b4d]" data-label="Price">{inr(p.price)}</td>
                  <td className="p-3" data-label="Stock"><span className={p.stock === 0 ? "text-[#d23f3f] font-bold" : p.stock <= 10 ? "text-[#b7791f] font-bold" : "text-[#0e1b4d]"}>{p.stock}</span></td>
                  <td className="p-3 text-[#6b7280]" data-label="Views">{p.views.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-[#6b7280]" data-label="Sales">{p.sales}</td>
                  <td className="p-3" data-label="Status"><Badge tone={PRODUCT_STATUS[p.status].tone}>{PRODUCT_STATUS[p.status].label}</Badge></td>
                  <td className="p-3" data-label="Actions">
                    <div className="flex items-center justify-end gap-1.5 text-[#6b7280]">
                      <a href={`/seller/products/new?id=${p.id}`} title="Edit" className="hover:text-[#3056D3]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg></a>
                      <button onClick={() => duplicateProduct(p.id)} title="Duplicate" className="hover:text-[#3056D3]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/></svg></button>
                      <button onClick={() => setProductStatus(p.id, p.status === "archived" ? "active" : "archived")} title="Archive" className="hover:text-[#b7791f]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7h18v13H3zM3 7l2-4h14l2 4M10 12h4"/></svg></button>
                      <button onClick={() => deleteProduct(p.id)} title="Delete" className="hover:text-[#d23f3f]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={10} className="p-10 text-center text-[#6b7280]">No products match your filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-5">
          <button disabled={cur === 1} onClick={() => setPage(cur - 1)} className="h-[34px] px-3 rounded-full border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold disabled:opacity-40">Prev</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)} className={`h-[34px] w-[34px] rounded-full text-[13px] font-bold ${n === cur ? "bg-[#3056D3] text-white" : "border border-[rgba(111,115,132,0.4)] text-[#0e1b4d]"}`}>{n}</button>
          ))}
          <button disabled={cur === pages} onClick={() => setPage(cur + 1)} className="h-[34px] px-3 rounded-full border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold disabled:opacity-40">Next</button>
        </div>
      )}
    </SellerShell>
  );
}
