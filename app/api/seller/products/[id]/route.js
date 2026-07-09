// Single seller product: read (GET), update (PATCH), delete (DELETE).
// Ownership is enforced — a seller can only touch their own products. Content
// edits reset the listing to "pending" for re-approval; stock-only updates and
// archive/unarchive do not (unarchive re-enters "pending").
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Product } from "@/lib/db/models/Product";
import { currentSeller } from "@/lib/seller/current";
import { runTransaction } from "@/lib/db/transaction";

const CONTENT_FIELDS = ["name", "brand", "sku", "category", "hsn", "gst", "mrp", "price", "wholesale", "moq", "images", "description", "shortDescription", "seo"];

async function ownProduct(id, session = null) {
  const seller = await currentSeller();
  if (!seller) return { error: "No seller profile", status: 403 };
  await dbConnect();
  const product = session ? await Product.findById(id).session(session) : await Product.findById(id);
  if (!product) return { error: "Not found", status: 404 };
  if (product.deleted === true) return { error: "Not found", status: 404 }; // Exclude soft-deleted
  if (String(product.seller) !== String(seller._id)) return { error: "Forbidden", status: 403 };
  return { product };
}

export async function GET(_req, { params }) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const { id } = await params;
  const r = await ownProduct(id);
  if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: r.status });
  return NextResponse.json({ ok: true, product: { ...r.product.toObject(), id: String(r.product._id) } });
}

export async function PATCH(req, { params }) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const { id } = await params;
  
  await dbConnect();

  try {
    let body;
    try { body = await req.json(); } catch { 
      return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 });
    }

    const result = await runTransaction(async (session) => {
      const r = await ownProduct(id, session);
      if (r.error) return r;

      const p = r.product;
      const keys = Object.keys(body);
      for (const k of [...CONTENT_FIELDS, "stock"]) if (k in body) p[k] = body[k];
      if ("images" in body) p.image = body.images?.[0];

      // Re-approval policy. Sellers cannot self-activate — submitting or unarchiving
      // always routes through "pending" for admin approval.
      const touchedContent = keys.some((k) => CONTENT_FIELDS.includes(k));
      if (body.status === "archived") p.status = "archived";
      else if (body.status === "draft") p.status = "draft";
      else if (body.status === "pending" || body.status === "active") p.status = "pending";
      else if (touchedContent && p.status !== "draft") p.status = "pending";

      await p.save({ session }); // Enforces optimistic concurrency checks via __v
      return { ok: true, id: String(p._id), status: p.status };
    });

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true, id: result.id, status: result.status });
  } catch (err) {
    console.error("[SELLER_PATCH] Transaction aborted:", err);
    return NextResponse.json({ ok: false, error: err.message || "Transaction error" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const { id } = await params;
  
  await dbConnect();

  try {
    const result = await runTransaction(async (session) => {
      const r = await ownProduct(id, session);
      if (r.error) return r;

      const p = r.product;
      p.deleted = true;
      p.status = "archived";
      await p.save({ session });
      return { ok: true };
    });

    if (result.error) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[SELLER_DELETE] Transaction aborted:", err);
    return NextResponse.json({ ok: false, error: err.message || "Transaction error" }, { status: 500 });
  }
}
