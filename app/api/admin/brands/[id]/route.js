// Admin Brand — update / enable-disable / delete.
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Brand } from "@/lib/db/models/Brand";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const Patch = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  slug: z.string().trim().max(80).optional(),
  logo: z.string().trim().max(500).optional(),
  banner: z.string().trim().max(500).optional(),
  description: z.string().trim().max(1000).optional(),
  seoTitle: z.string().trim().max(160).optional(),
  seoDescription: z.string().trim().max(320).optional(),
  active: z.coerce.boolean().optional(),
});

export async function PATCH(req, { params }) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const { id } = await params;
  let body; try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Patch.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  await dbConnect();
  const d = { ...parsed.data };
  if (d.slug) d.slug = slugify(d.slug);
  if (d.slug && await Brand.exists({ slug: d.slug, _id: { $ne: id } })) return NextResponse.json({ ok: false, errors: { slug: ["Slug already in use"] } }, { status: 409 });
  const brand = await Brand.findByIdAndUpdate(id, { $set: d }, { new: true });
  if (!brand) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const { id } = await params;
  await dbConnect();
  const r = await Brand.findByIdAndDelete(id);
  if (!r) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
