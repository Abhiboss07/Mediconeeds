// Seller product collection: list own products (GET) and create a new one (POST).
// New products enter "pending" and require admin approval before going live.
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Product } from "@/lib/db/models/Product";
import { currentSeller } from "@/lib/seller/current";
import { runTransaction } from "@/lib/db/transaction";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CreateSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(160),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  sku: z.string().trim().max(60).optional().or(z.literal("")),
  category: z.string().trim().max(80).optional().or(z.literal("")),
  hsn: z.string().trim().max(20).optional().or(z.literal("")),
  gst: z.coerce.number().min(0).max(28).optional(),
  mrp: z.coerce.number().min(0).optional(),
  price: z.coerce.number().min(0, "Price required"),
  wholesale: z.coerce.number().min(0).optional(),
  moq: z.coerce.number().min(1).optional(),
  stock: z.coerce.number().min(0).optional(),
  images: z.array(z.string()).optional(),
  description: z.string().max(5000).optional().or(z.literal("")),
  shortDescription: z.string().max(400).optional().or(z.literal("")),
  seo: z.object({ title: z.string().optional(), description: z.string().optional(), keywords: z.array(z.string()).optional() }).optional(),
  // Seller may save a draft (no approval) or submit for approval (pending).
  status: z.enum(["draft", "pending"]).optional(),
});

export async function GET(req) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const q = { seller: seller._id, deleted: { $ne: true } };
  const status = searchParams.get("status");
  if (status && status !== "all") q.status = status;

  const products = await Product.find(q).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ ok: true, products: products.map((p) => ({ ...p, id: String(p._id), _id: undefined })) });
}

export async function POST(req) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 422 });

  await dbConnect();

  try {
    const result = await runTransaction(async (session) => {
      const d = parsed.data;
      const product = new Product({
        ...d, seller: seller._id, image: d.images?.[0],
        // Drafts stay private; anything submitted enters "pending" for approval.
        status: d.status === "draft" ? "draft" : "pending",
      });
      await product.save({ session });
      return { id: String(product._id), status: product.status };
    });

    return NextResponse.json({ ok: true, id: result.id, status: result.status }, { status: 201 });
  } catch (err) {
    console.error("[SELLER_POST] Transaction aborted:", err);
    return NextResponse.json({ ok: false, error: err.message || "Transaction error" }, { status: 500 });
  }
}
