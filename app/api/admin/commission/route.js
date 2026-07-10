// Admin Commission settings (singleton) — get + update. Never cached.
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Commission } from "@/lib/db/models/Commission";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const pct = z.coerce.number().min(0).max(100);
const Schema = z.object({
  global: pct.optional(),
  gst: pct.optional(),
  platformFee: pct.optional(),
  categoryRates: z.array(z.object({ category: z.string().trim().min(1), rate: pct })).optional(),
  sellerOverrides: z.array(z.object({ sellerId: z.string().trim().min(1), sellerName: z.string().trim().optional(), rate: pct })).optional(),
});

async function getDoc() {
  return Commission.findOneAndUpdate({ key: "global" }, { $setOnInsert: { key: "global" } }, { new: true, upsert: true }).lean();
}

export async function GET() {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  await dbConnect();
  const d = await getDoc();
  return NextResponse.json({
    ok: true,
    commission: {
      global: d.global ?? 8, gst: d.gst ?? 18, platformFee: d.platformFee ?? 2,
      categoryRates: (d.categoryRates || []).map((c) => ({ category: c.category, rate: c.rate })),
      sellerOverrides: (d.sellerOverrides || []).map((s) => ({ sellerId: s.sellerId, sellerName: s.sellerName || "", rate: s.rate })),
    },
  });
}

export async function PATCH(req) {
  const g = await apiGuard("admin");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  let body; try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  await dbConnect();
  const set = {};
  for (const [k, v] of Object.entries(parsed.data)) if (v !== undefined) set[k] = v;
  await Commission.findOneAndUpdate({ key: "global" }, { $set: set, $setOnInsert: { key: "global" } }, { upsert: true });
  return NextResponse.json({ ok: true });
}
