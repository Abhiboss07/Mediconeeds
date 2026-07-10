// Admin Brands — list (with live product counts) + create. Never cached.
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Brand } from "@/lib/db/models/Brand";
import { CatalogProduct } from "@/lib/db/models/CatalogProduct";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const Schema = z.object({
  name: z.string().trim().min(2, "Name is required").max(80),
  slug: z.string().trim().max(80).optional(),
  logo: z.string().trim().max(500).optional().or(z.literal("")),
  banner: z.string().trim().max(500).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  seoTitle: z.string().trim().max(160).optional().or(z.literal("")),
  seoDescription: z.string().trim().max(320).optional().or(z.literal("")),
  active: z.coerce.boolean().optional(),
});

async function countsByVendor() {
  const rows = await CatalogProduct.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$vendor", n: { $sum: 1 } } }]);
  const map = {};
  for (const r of rows) if (r._id) map[String(r._id).toLowerCase()] = r.n;
  return map;
}

export async function GET(req) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  await dbConnect();
  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  const filter = q ? { $or: [{ name: new RegExp(q, "i") }, { slug: new RegExp(q, "i") }] } : {};
  const [brands, counts] = await Promise.all([Brand.find(filter).sort({ name: 1 }).lean(), countsByVendor()]);
  return NextResponse.json({
    ok: true,
    brands: brands.map((b) => ({
      id: String(b._id), name: b.name, slug: b.slug, logo: b.logo || "", banner: b.banner || "",
      description: b.description || "", seoTitle: b.seoTitle || "", seoDescription: b.seoDescription || "",
      active: b.active !== false, productCount: counts[String(b.name).toLowerCase()] || 0,
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
  if (await Brand.exists({ slug })) return NextResponse.json({ ok: false, errors: { slug: ["A brand with this slug already exists"] } }, { status: 409 });
  const brand = await Brand.create({ ...d, slug, active: d.active !== false });
  return NextResponse.json({ ok: true, id: String(brand._id) }, { status: 201 });
}
