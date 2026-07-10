// Buyer notifications: list (GET) and mark-all-read (POST) for the current buyer.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Notification, relativeTime } from "@/lib/db/models/Notification";
import { currentBuyer } from "@/lib/account/current";

export async function GET() {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: true, notifications: [] });

  await dbConnect();
  const notes = await Notification.find({ user: buyer._id }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    ok: true,
    notifications: notes.map((n) => ({ id: String(n._id), type: n.type, title: n.title, body: n.body, read: n.read, time: relativeTime(n.createdAt) })),
  });
}

export async function POST(req) {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { body = {}; }
  await dbConnect();
  if (body.action === "markAll") await Notification.updateMany({ user: buyer._id, read: false }, { $set: { read: true } });
  return NextResponse.json({ ok: true });
}
