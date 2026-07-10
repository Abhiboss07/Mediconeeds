// Admin Categories — list (with live product counts) + create. Never cached.
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Category } from "@/lib/db/models/Category";
import { CatalogProduct } from "@/lib/db/models/CatalogProduct";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const Schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z.string().trim().max(80).optional(),
  image: z.string().trim().max(500).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  displayOrder: z.coerce.number().int().optional(),
  active: z.coerce.boolean().optional(),
});

async function countsMap() {
  const rows = await CatalogProduct.aggregate([
    { $match: { status: "active" } },
    { $group: { _id: { slug: "$category", name: "$categoryName" }, n: { $sum: 1 } } },
  ]);
  const bySlug = {}, byName = {};
  for (const r of rows) { if (r._id.slug) bySlug[r._id.slug] = (bySlug[r._id.slug] || 0) + r.n; if (r._id.name) byName[r._id.name] = (byName[r._id.name] || 0) + r.n; }
  return { bySlug, byName };
}

export async function GET(req) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  await dbConnect();
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  const filter = q ? { $or: [{ name: new RegExp(q, "i") }, { slug: new RegExp(q, "i") }] } : {};
  const [cats, counts] = await Promise.all([
    Category.find(filter).sort({ displayOrder: 1, name: 1 }).lean(),
    countsMap(),
  ]);
  return NextResponse.json({
    ok: true,
    categories: cats.map((c) => ({
      id: String(c._id), name: c.name, slug: c.slug, image: c.image || "",
      seoTitle: c.seoTitle || "", seoDescription: c.seoDescription || "",
      displayOrder: c.displayOrder || 0, active: c.active !== false,
      productCount: counts.bySlug[c.slug] || counts.byName[c.name] || 0,
    })),
  });
}

export async function POST(req) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  let body; try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  await dbConnect();
  const d = parsed.data;
  const slug = slugify(d.slug || d.name);
  if (await Category.exists({ slug })) return NextResponse.json({ ok: false, errors: { slug: ["A category with this slug already exists"] } }, { status: 409 });
  const cat = await Category.create({ ...d, slug, active: d.active !== false });
  return NextResponse.json({ ok: true, id: String(cat._id) }, { status: 201 });
}
