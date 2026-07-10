// Admin Banners — list + create. Never cached.
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Banner, BANNER_TYPES } from "@/lib/db/models/Banner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const dateOrNull = z.union([z.string(), z.null()]).optional().transform((v) => (v ? new Date(v) : null));

const Schema = z.object({
  title: z.string().trim().min(2, "Title is required").max(120),
  type: z.enum(BANNER_TYPES).optional(),
  desktopImage: z.string().trim().max(500).optional().or(z.literal("")),
  mobileImage: z.string().trim().max(500).optional().or(z.literal("")),
  link: z.string().trim().max(500).optional().or(z.literal("")),
  priority: z.coerce.number().int().optional(),
  startDate: dateOrNull,
  endDate: dateOrNull,
  active: z.coerce.boolean().optional(),
});

function liveStatus(b) {
  if (!b.active) return "disabled";
  const now = Date.now();
  if (b.startDate && new Date(b.startDate).getTime() > now) return "scheduled";
  if (b.endDate && new Date(b.endDate).getTime() < now) return "expired";
  return "live";
}

export async function GET() {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  await dbConnect();
  const banners = await Banner.find({}).sort({ priority: 1, createdAt: -1 }).lean();
  return NextResponse.json({
    ok: true,
    banners: banners.map((b) => ({
      id: String(b._id), title: b.title, type: b.type, desktopImage: b.desktopImage || "", mobileImage: b.mobileImage || "",
      link: b.link || "", priority: b.priority || 0,
      startDate: b.startDate ? new Date(b.startDate).toISOString().slice(0, 10) : "",
      endDate: b.endDate ? new Date(b.endDate).toISOString().slice(0, 10) : "",
      active: b.active !== false, status: liveStatus(b),
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
  const banner = await Banner.create({ ...parsed.data, active: parsed.data.active !== false });
  return NextResponse.json({ ok: true, id: String(banner._id) }, { status: 201 });
}
