// Public workshops listing. Splits into upcoming vs past by start date at read
// time so a single set of records stays correct over time. Database-driven.
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Workshop, WorkshopRegistration } from "@/lib/db/models/Workshop";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  await dbConnect();
  const docs = await Workshop.find({ published: true }).sort({ startsAt: 1 }).lean();
  const counts = await WorkshopRegistration.aggregate([{ $group: { _id: "$workshop", n: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));

  const now = Date.now();
  const shape = (w) => ({
    id: String(w._id),
    title: w.title,
    slug: w.slug,
    summary: w.summary || "",
    description: w.description || "",
    startsAt: w.startsAt,
    durationLabel: w.durationLabel || "",
    venue: w.venue || "",
    city: w.city || "",
    price: w.price || 0,
    seatsTotal: w.seatsTotal || 0,
    seatsLeft: Math.max(0, (w.seatsTotal || 0) - (countMap[String(w._id)] || 0)),
    image: w.image || "",
    highlights: w.highlights || [],
    benefits: w.benefits || [],
    faqs: w.faqs || [],
  });

  const upcoming = [];
  const past = [];
  for (const w of docs) (new Date(w.startsAt).getTime() >= now ? upcoming : past).push(shape(w));
  past.reverse(); // most recent past first

  return NextResponse.json({ ok: true, upcoming, past });
}
