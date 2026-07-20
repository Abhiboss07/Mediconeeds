// Contact form submission. Hardened to match the rest of the API surface:
// malformed/oversized bodies are rejected with a precise status and a GENERIC
// message (no parser internals leaked), inputs are length-bounded, and only the
// whitelisted fields are ever persisted (no mass assignment).
import { NextResponse } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { Contact } from "@/lib/db/models/Contact";

// Reject bodies larger than this before parsing — a contact message is small;
// anything bigger is abuse or a mistake. Blocks memory-pressure payloads.
const MAX_BODY_BYTES = 16 * 1024; // 16 KB

const Schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(20).optional().default(""),
  message: z.string().trim().min(1).max(4000),
});

export async function POST(req) {
  // 1) Size guard — cheap rejection before we read/parse the body.
  const len = Number(req.headers.get("content-length") || 0);
  if (len && len > MAX_BODY_BYTES) {
    return NextResponse.json({ ok: false, error: "Message too large." }, { status: 413 });
  }

  // 2) Parse JSON in isolation → a malformed body is a clean 400, never a 500
  //    and never leaks the parser error.
  let raw;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  // 3) Validate + coerce. Unknown fields are dropped by the schema.
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please fill in your name, a valid email, and a message." }, { status: 422 });
  }

  // 4) Persist only whitelisted fields.
  try {
    await dbConnect();
    await Contact.create({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Log the real cause server-side; return a generic message to the client.
    console.error("[CONTACT_API] Failed to save submission:", err);
    return NextResponse.json({ ok: false, error: "Could not send your message right now. Please try again." }, { status: 500 });
  }
}
