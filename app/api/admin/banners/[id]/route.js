// Admin Banner — update / toggle / delete.
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Banner, BANNER_TYPES } from "@/lib/db/models/Banner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateOrNull = z.union([z.string(), z.null()]).optional().transform((v) => (v === undefined ? undefined : v ? new Date(v) : null));

const Patch = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  type: z.enum(BANNER_TYPES).optional(),
  desktopImage: z.string().trim().max(500).optional(),
  mobileImage: z.string().trim().max(500).optional(),
  link: z.string().trim().max(500).optional(),
  priority: z.coerce.number().int().optional(),
  startDate: dateOrNull,
  endDate: dateOrNull,
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
  const set = {};
  for (const [k, val] of Object.entries(parsed.data)) if (val !== undefined) set[k] = val;
  const banner = await Banner.findByIdAndUpdate(id, { $set: set }, { new: true });
  if (!banner) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const { id } = await params;
  await dbConnect();
  const r = await Banner.findByIdAndDelete(id);
  if (!r) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
