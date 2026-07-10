// Admin: list seller applications (pending) and active/other sellers from Mongo.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Seller } from "@/lib/db/models/Seller";

const shapePending = (s) => ({
  id: String(s._id), ref: s.applicationRef, company: s.company, owner: s.owner,
  gstin: s.gst || "—", categories: s.categories || [],
  docs: Object.values(s.documents || {}).filter(Boolean).length,
});
const shapeActive = (s) => ({
  id: String(s._id), ref: s.applicationRef, company: s.company, owner: s.owner,
  products: 0, gmv: 0, rating: s.rating || 0, status: s.approval,
});

export async function GET() {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });

  await dbConnect();
  const sellers = await Seller.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    ok: true,
    pending: sellers.filter((s) => s.approval === "pending").map(shapePending),
    active: sellers.filter((s) => s.approval !== "pending").map(shapeActive),
  });
}
