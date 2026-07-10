import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { Contact } from "@/lib/db/models/Contact";

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();
    const msg = new Contact({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone || "").trim(),
      message: String(message).trim(),
    });

    await msg.save();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CONTACT_API] Error processing contact submission:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
