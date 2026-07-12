// Download the tax invoice (PDF) for a single settlement of the current seller.
import { apiGuard } from "@/lib/auth/session";
import { currentSeller } from "@/lib/seller/current";
import { dbConnect } from "@/lib/db/mongoose";
import { Settlement } from "@/lib/db/models/Settlement";
import { shapeSettlement } from "@/lib/seller/wallet";
import { settlementInvoice } from "@/lib/pdf/documents";

export const dynamic = "force-dynamic";

const json = (body, status) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export async function GET(_req, { params }) {
  const g = await apiGuard("seller");
  if (!g.ok) return json({ ok: false }, g.status);
  const seller = await currentSeller();
  if (!seller) return json({ ok: false, error: "No seller profile" }, 403);

  const { id } = await params;
  await dbConnect();
  // Scope strictly to this seller so one seller can never fetch another's invoice.
  const doc = await Settlement.findOne({ _id: id, seller: seller._id }).lean().catch(() => null);
  if (!doc) return json({ ok: false, error: "Settlement not found" }, 404);

  const s = shapeSettlement(doc);
  const pdf = settlementInvoice({
    seller: { company: seller.company, owner: seller.owner, address: seller.address || "", gst: seller.gst || "", email: seller.email || "" },
    settlementNo: s.settlementNo,
    invoiceNo: s.invoiceNo,
    date: s.date,
    periodLabel: s.periodLabel,
    orderCount: s.orderCount,
    gross: s.gross,
    commissionRate: s.commissionRate,
    commission: s.commission,
    gstRate: s.gstRate,
    gstOnCommission: s.gstOnCommission,
    net: s.net,
    txnRef: s.txnRef,
    status: s.status,
  });

  return new Response(pdf, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="settlement-${s.settlementNo}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
