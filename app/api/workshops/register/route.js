// Register for a workshop. Public (no login required) — captures the attendee's
// contact details. If a session exists we link the user. Dedupes on (workshop,
// email) so a double-submit doesn't create duplicates.
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/db/mongoose";
import { Workshop, WorkshopRegistration } from "@/lib/db/models/Workshop";

export const dynamic = "force-dynamic";

const Input = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(20).optional(),
  organisation: z.string().trim().max(120).optional(),
});

export async function POST(req) {
  let body; try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Input.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid details" }, { status: 422 });

  await dbConnect();
  const ws = await Workshop.findOne({ slug: parsed.data.slug, published: true });
  if (!ws) return NextResponse.json({ ok: false, error: "Workshop not found" }, { status: 404 });
  if (new Date(ws.startsAt).getTime() < Date.now()) return NextResponse.json({ ok: false, error: "This workshop has already taken place." }, { status: 409 });

  const user = (await auth())?.user || null;
  try {
    await WorkshopRegistration.create({
      workshop: ws._id,
      workshopTitle: ws.title,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || "",
      organisation: parsed.data.organisation || "",
      user: user?.id || null,
    });
  } catch (e) {
    if (e?.code === 11000) return NextResponse.json({ ok: true, already: true, message: "You're already registered for this workshop." });
    throw e;
  }

  return NextResponse.json({ ok: true, message: `You're registered for “${ws.title}”. We'll email you the details.` });
}
