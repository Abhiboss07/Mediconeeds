// Download a consolidated GST settlement report (PDF) for the current seller.
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";
import { dbConnect } from "@/lib/db/mongoose";
import { Settlement } from "@/lib/db/models/Settlement";
import { shapeSettlement } from "@/lib/seller/wallet";
import { gstReport } from "@/lib/pdf/documents";

export const dynamic = "force-dynamic";

export async function GET() {
  const g = await apiGuard("seller");
  if (!g.ok) return new Response(JSON.stringify({ ok: false }), { status: g.status, headers: { "content-type": "application/json" } });
  const seller = await currentSeller();
  if (!seller) return new Response(JSON.stringify({ ok: false, error: "No seller profile" }), { status: 403, headers: { "content-type": "application/json" } });

  await dbConnect();
  const docs = await Settlement.find({ seller: seller._id }).sort({ periodEnd: 1 }).lean();
  const rows = docs.map(shapeSettlement);

  const pdf = gstReport({
    seller: { company: seller.company, gst: seller.gst || "", email: seller.email || "" },
    generatedAt: new Date(),
    periodLabel: rows.length ? `${rows.length} settlements` : "No settlements yet",
    rows,
  });

  const safe = (seller.company || "seller").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return new Response(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="gst-settlement-report-${safe}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
