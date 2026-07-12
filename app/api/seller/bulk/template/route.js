// Download the sample CSV template or the plain-text instructions.
//   /api/seller/bulk/template            → sample-products.csv
//   /api/seller/bulk/template?doc=instructions → instructions.txt
import { apiGuard } from "@/lib/auth/session";
import { sampleTemplateCsv } from "@/lib/bulk/csv";
import { INSTRUCTIONS } from "@/lib/bulk/columns";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const g = await apiGuard("seller");
  if (!g.ok) return new Response(JSON.stringify({ ok: false }), { status: g.status, headers: { "content-type": "application/json" } });

  const doc = new URL(req.url).searchParams.get("doc");
  if (doc === "instructions") {
    return new Response(INSTRUCTIONS, {
      headers: { "content-type": "text/plain; charset=utf-8", "content-disposition": 'attachment; filename="bulk-upload-instructions.txt"', "cache-control": "no-store" },
    });
  }
  return new Response(sampleTemplateCsv(), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="sample-products.csv"', "cache-control": "no-store" },
  });
}
