"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SellerShell from "@/components/seller/SellerShell";
import { SectionCard } from "@/components/seller/ui";
import { TextField, TextArea, SelectField, FileField } from "@/components/forms/FormKit";
import { useSellerStore, addProduct, updateProduct } from "@/lib/seller/store";
import { SELLER_CATEGORIES } from "@/lib/seller/models";

function Num({ label, name, value, onChange, required, placeholder, prefix }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">{label}{required && <span className="text-[#dc2626]"> *</span>}</span>
      <div className="flex items-center rounded-[10px] border border-[rgba(111,115,132,0.4)] focus-within:border-[#3056D3] bg-white h-[44px] px-3">
        {prefix && <span className="text-[#6b7280] text-[14px] mr-1">{prefix}</span>}
        <input type="number" inputMode="numeric" value={value} placeholder={placeholder} onChange={(e) => onChange(name, e.target.value)} className="w-full outline-none text-[14px] bg-transparent" />
      </div>
    </label>
  );
}

function AddProductInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const s = useSellerStore();
  const editId = sp.get("id");
  const existing = editId ? s.products.find((p) => p.id === editId) : null;

  const [v, setV] = useState(existing || { gst: 18, moq: 5, category: SELLER_CATEGORIES[4], brand: "Dr Awish" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (name, val) => setV((st) => ({ ...st, [name]: val }));
  const f = (name) => ({ name, value: v[name] ?? "", onChange: set });

  // When editing, re-initialise the form once the product hydrates from the API.
  useEffect(() => { if (existing && v.id !== existing.id) setV(existing); }, [existing?.id]); // eslint-disable-line

  const save = async (status) => {
    if (!v.name || !v.category || !v.price) { setErr("Product name, category and selling price are required."); return; }
    setBusy(true);
    const payload = {
      name: v.name, brand: v.brand || "Dr Awish", category: v.category, sku: v.sku || ("DAW-" + Date.now().toString(36).toUpperCase()),
      hsn: v.hsn || "3304", gst: Number(v.gst) || 18, mrp: Number(v.mrp) || Number(v.price), price: Number(v.price),
      wholesale: Number(v.wholesale) || Number(v.price), moq: Number(v.moq) || 1, stock: Number(v.stock) || 0,
      image: v.image || "/catalog/10-vitamin-c-serum.svg",
      description: v.description, metaTitle: v.metaTitle, metaDescription: v.metaDescription, status,
    };
    try {
      if (editId) await updateProduct(editId, payload); else await addProduct(payload);
      router.push("/seller/products");
    } catch { setErr("Could not save the product. Please try again."); setBusy(false); }
  };

  const Actions = (
    <div className="hidden sm:flex items-center gap-2">
      <button onClick={() => save("draft")} disabled={busy} className="h-[38px] px-4 rounded-full border border-[rgba(111,115,132,0.4)] text-[13px] font-semibold text-[#0e1b4d]">Save draft</button>
      <button onClick={() => save("pending")} disabled={busy} className="h-[38px] px-4 rounded-full bg-[#3056D3] text-white text-[13px] font-bold">{editId ? "Update" : "Publish"} →</button>
    </div>
  );

  return (
    <SellerShell active="/seller/products/new" title={editId ? "Edit Product" : "Add Product"} subtitle="Create a listing buyers can order" actions={Actions}>
      {err && <div className="mb-4 px-4 py-3 rounded-[10px] bg-[#fdecec] text-[#d23f3f] text-[13px] font-semibold">{err}</div>}
      <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="space-y-4">
          <SectionCard title="Basic details">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Product name" required placeholder="Dr Awish Vitamin C Serum" {...f("name")} />
              <TextField label="Brand" placeholder="Dr Awish" {...f("brand")} />
              <SelectField label="Category" required options={SELLER_CATEGORIES} {...f("category")} />
              <TextField label="HSN code" placeholder="3304" {...f("hsn")} />
              <div className="sm:col-span-2"><TextArea label="Description" rows={4} placeholder="Describe the product, key ingredients and usage…" {...f("description")} /></div>
              <Num label="GST %" name="gst" value={v.gst ?? ""} onChange={set} placeholder="18" />
            </div>
          </SectionCard>

          <SectionCard title="Pricing">
            <div className="grid sm:grid-cols-2 gap-4">
              <Num label="MRP" name="mrp" value={v.mrp ?? ""} onChange={set} prefix="₹" placeholder="1799" />
              <Num label="Selling price" name="price" value={v.price ?? ""} onChange={set} prefix="₹" required placeholder="1199" />
              <Num label="Wholesale price" name="wholesale" value={v.wholesale ?? ""} onChange={set} prefix="₹" placeholder="999" />
              <Num label="Min. order qty (MOQ)" name="moq" value={v.moq ?? ""} onChange={set} placeholder="5" />
            </div>
          </SectionCard>

          <SectionCard title="Inventory & shipping">
            <div className="grid sm:grid-cols-2 gap-4">
              <Num label="Stock" name="stock" value={v.stock ?? ""} onChange={set} placeholder="100" />
              <TextField label="SKU" placeholder="Auto-generated if blank" {...f("sku")} />
              <TextField label="Barcode" placeholder="EAN / UPC" {...f("barcode")} />
              <Num label="Shipping weight (g)" name="weight" value={v.weight ?? ""} onChange={set} placeholder="250" />
              <TextField label="Dimensions (L×W×H cm)" placeholder="12 × 5 × 5" {...f("dimensions")} />
            </div>
          </SectionCard>

          <SectionCard title="Media">
            <div className="grid sm:grid-cols-2 gap-4">
              <FileField label="Product images" name="images" value={v.images} onChange={set} hint="Upload multiple (JPG/PNG)" />
              <FileField label="Thumbnail" name="thumbnail" value={v.thumbnail} onChange={set} hint="Square, 1:1" />
              <FileField label="Product video" name="video" value={v.video} onChange={set} hint="MP4 (optional)" />
            </div>
          </SectionCard>

          <SectionCard title="SEO">
            <div className="grid sm:grid-cols-2 gap-4">
              <TextField label="Meta title" placeholder="Buy Dr Awish Vitamin C Serum online" {...f("metaTitle")} />
              <TextField label="URL slug" placeholder="dr-awish-vitamin-c-serum" {...f("slug")} />
              <div className="sm:col-span-2"><TextArea label="Meta description" rows={2} placeholder="Short description for search engines…" {...f("metaDescription")} /></div>
            </div>
          </SectionCard>
        </div>

        {/* publish sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-[76px]">
          <SectionCard title="Publish">
            <p className="text-[13px] text-[#6b7280] mb-3">New listings go live after Mediconeeds approval (usually within 24h).</p>
            <div className="space-y-2">
              <button onClick={() => save("pending")} disabled={busy} className="w-full h-[44px] rounded-full bg-[#3056D3] text-white text-[14px] font-bold">{editId ? "Update product" : "Submit for approval"}</button>
              <button onClick={() => save("draft")} disabled={busy} className="w-full h-[44px] rounded-full border border-[rgba(111,115,132,0.4)] text-[14px] font-bold text-[#0e1b4d]">Save as draft</button>
              <a href="/seller/products" className="block text-center w-full h-[44px] leading-[44px] rounded-full text-[13px] font-semibold text-[#6b7280]">Cancel</a>
            </div>
          </SectionCard>
          <SectionCard title="Preview">
            <div className="rounded-[12px] border border-[#eef0f5] p-3">
              <img src={v.image || v.thumbnail || "/catalog/10-vitamin-c-serum.svg"} alt="" className="w-full aspect-square object-contain bg-[#fafbff] rounded-[8px]" />
              <div className="text-[13px] font-semibold text-[#0e1b4d] mt-2 line-clamp-2">{v.name || "Product name"}</div>
              <div className="text-[15px] font-extrabold text-[#0e1b4d] mt-1">₹{Number(v.price || 0).toLocaleString("en-IN")}</div>
            </div>
          </SectionCard>
        </aside>
      </div>
    </SellerShell>
  );
}

export default function Page() {
  return <Suspense fallback={<div className="p-10 text-center text-[#6b7280]">Loading…</div>}><AddProductInner /></Suspense>;
}
