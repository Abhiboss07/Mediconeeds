// Download the error report (failed-products.csv: Row, SKU, Reason) for a batch.
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";
import { dbConnect } from "@/lib/db/mongoose";
import { ImportBatch } from "@/lib/db/models/ImportBatch";
import { errorReportCsv } from "@/lib/bulk/csv";

export const dynamic = "force-dynamic";

const json = (b, s) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });

export async function GET(_req, { params }) {
  const g = await apiGuard("seller");
  if (!g.ok) return json({ ok: false }, g.status);
  const seller = await currentSeller();
  if (!seller) return json({ ok: false, error: "No seller profile" }, 403);

  const { batchId } = await params;
  await dbConnect();
  const batch = await ImportBatch.findOne({ _id: batchId, seller: seller._id }).lean().catch(() => null);
  if (!batch) return json({ ok: false, error: "Batch not found" }, 404);

  return new Response(errorReportCsv(batch), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="failed-products-${batchId}.csv"`,
      "cache-control": "no-store",
    },
  });
}
