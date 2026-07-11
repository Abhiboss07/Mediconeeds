// ============================================================================
// Buyer wishlist — CatalogProduct handles stored on the User. All operations are
// scoped to the current buyer; a new account starts with an empty wishlist.
// ============================================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { CatalogProduct } from "@/lib/db/models/CatalogProduct";
import { currentBuyer } from "@/lib/account/current";

const Body = z.object({ handle: z.string().trim().min(1), action: z.enum(["add", "remove", "toggle"]).default("toggle") });

export async function GET() {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: true, items: [] });

  await dbConnect();
  const handles = Array.isArray(buyer.wishlist) ? buyer.wishlist : [];
  if (!handles.length) return NextResponse.json({ ok: true, items: [] });

  const products = await CatalogProduct.find({ handle: { $in: handles } }).select("handle title image priceMin").lean();
  // Preserve wishlist order (newest first = as stored).
  const byHandle = new Map(products.map((p) => [p.handle, p]));
  const items = handles
    .map((h) => byHandle.get(h))
    .filter(Boolean)
    .map((p) => ({ handle: p.handle, title: p.title, image: p.image, price: p.priceMin || 0 }));
  return NextResponse.json({ ok: true, items });
}

export async function POST(req) {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Sign in to use your wishlist." }, { status: 401 });

  let json;
  try { json = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 422 });
  const { handle, action } = parsed.data;

  await dbConnect();
  const list = Array.isArray(buyer.wishlist) ? buyer.wishlist : [];
  const has = list.includes(handle);
  const shouldHave = action === "add" ? true : action === "remove" ? false : !has;
  buyer.wishlist = shouldHave ? (has ? list : [handle, ...list]) : list.filter((h) => h !== handle);
  await buyer.save();
  return NextResponse.json({ ok: true, inWishlist: shouldHave, count: buyer.wishlist.length });
}
