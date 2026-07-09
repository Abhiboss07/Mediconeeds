// Admin: product moderation queue. Returns pending products (and, optionally,
// all) with their seller's company name for context.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Product } from "@/lib/db/models/Product";
import { Seller } from "@/lib/db/models/Seller";

export async function GET(req) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const q = status === "all" ? { deleted: { $ne: true } } : { status, deleted: { $ne: true } };

  const products = await Product.find(q).sort({ createdAt: -1 }).lean();
  const sellerIds = [...new Set(products.map((p) => String(p.seller)).filter(Boolean))];
  const sellers = await Seller.find({ _id: { $in: sellerIds } }).select("company").lean();
  const nameOf = Object.fromEntries(sellers.map((s) => [String(s._id), s.company]));

  return NextResponse.json({
    ok: true,
    products: products.map((p) => ({
      id: String(p._id), name: p.name, sku: p.sku, category: p.category, brand: p.brand,
      mrp: p.mrp, price: p.price, image: p.image, status: p.status,
      seller: nameOf[String(p.seller)] || "—", createdAt: p.createdAt,
    })),
  });
}
