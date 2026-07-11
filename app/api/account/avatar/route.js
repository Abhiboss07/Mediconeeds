// ============================================================================
// Buyer avatar upload. The client crops+resizes to a small square JPEG and sends
// it as a data URI; we store that string on the User. Storing the (tiny) image
// inline keeps it durable on hosts with an ephemeral filesystem (e.g. Render)
// and needs no S3/Cloudinary credentials. Swap for object storage when available.
// ============================================================================
import { NextResponse } from "next/server";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { currentBuyer } from "@/lib/account/current";

const MAX_BYTES = 300 * 1024; // ~300 KB cap on the encoded string
const ALLOWED = /^data:image\/(png|jpeg|webp);base64,/;

export async function POST(req) {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  let json; try { json = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const dataUrl = String(json?.dataUrl || "");

  if (json?.remove === true) {
    await dbConnect();
    buyer.avatarUrl = "";
    await buyer.save();
    return NextResponse.json({ ok: true, avatarUrl: "" });
  }

  if (!ALLOWED.test(dataUrl)) return NextResponse.json({ ok: false, error: "Upload a PNG, JPEG or WEBP image." }, { status: 422 });
  if (dataUrl.length > MAX_BYTES) return NextResponse.json({ ok: false, error: "Image is too large. Please choose a smaller photo." }, { status: 413 });

  await dbConnect();
  buyer.avatarUrl = dataUrl;
  await buyer.save();
  return NextResponse.json({ ok: true, avatarUrl: dataUrl });
}
