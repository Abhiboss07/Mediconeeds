// ============================================================================
// Live catalogue search — used by the header search overlay. Queries MongoDB
// (CatalogProduct) at request time and returns lightweight product cards.
// ============================================================================
import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/catalog/store";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const q = new URL(req.url).searchParams.get("q") || "";
  try {
    const items = await searchProducts(q, 8);
    return NextResponse.json({
      ok: true,
      items: items.map((p) => ({ id: p.id, slug: p.slug, title: p.title, image: p.image, price: p.price })),
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "search failed", items: [] }, { status: 500 });
  }
}
