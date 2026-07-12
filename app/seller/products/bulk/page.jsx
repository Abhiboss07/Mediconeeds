"use client";
import SellerShell from "@/components/seller/SellerShell";
import BulkUpload from "@/components/seller/BulkUpload";

export default function Page() {
  return (
    <SellerShell active="/seller/products/bulk" title="Bulk Product Upload" subtitle="Import many products at once from CSV / XLSX"
      actions={<a href="/seller/products/bulk/history" className="h-[38px] px-4 rounded-full border border-[#e2e5ee] text-[#374151] text-[12.5px] font-bold inline-flex items-center">Import history</a>}>
      <BulkUpload />
    </SellerShell>
  );
}
