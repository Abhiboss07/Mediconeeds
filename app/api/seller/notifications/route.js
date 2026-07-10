// Seller notifications: list (GET) and mark actions (POST) for the current
// seller's user account.
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { Notification, relativeTime } from "@/lib/db/models/Notification";
import { currentSeller } from "@/lib/seller/current";

export async function GET() {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  await dbConnect();
  const notes = await Notification.find({ user: seller.user }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    ok: true,
    notifications: notes.map((n) => ({ id: String(n._id), type: n.type, title: n.title, body: n.body, read: n.read, time: relativeTime(n.createdAt), link: n.link || "" })),
  });
}

export async function POST(req) {
  const g = await apiGuard("seller");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const seller = await currentSeller();
  if (!seller) return NextResponse.json({ ok: false, error: "No seller profile" }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }

  await dbConnect();
  if (body.action === "markAll") {
    await Notification.updateMany({ user: seller.user, read: false }, { $set: { read: true } });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "toggle" && body.id) {
    const n = await Notification.findOne({ _id: body.id, user: seller.user });
    if (!n) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    n.read = !n.read;
    await n.save();
    return NextResponse.json({ ok: true, read: n.read });
  }
  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
