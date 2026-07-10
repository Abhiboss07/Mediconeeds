// Export enquiry endpoint (backend-ready placeholder).
// Validates server-side and returns a reference id. Persistence/notification is
// stubbed — wire `persistEnquiry` to a DB/CRM/email service when available.
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { ExportEnquiry } from "@/lib/db/models/ExportEnquiry";

const required = ["name", "email", "country", "message"];
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

async function persistEnquiry(record) {
  await dbConnect();
  await ExportEnquiry.create(record);
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }); }

  const missing = required.filter((k) => !String(body?.[k] || "").trim());
  if (missing.length) return NextResponse.json({ ok: false, error: `Missing: ${missing.join(", ")}` }, { status: 422 });
  if (!isEmail(body.email)) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 422 });

  const ref = "EXP-" + Date.now().toString(36).toUpperCase();
  const record = {
    ref,
    type: "export-enquiry",
    name: String(body.name).trim(),
    email: String(body.email).trim(),
    phone: String(body.phone || "").trim(),
    company: String(body.company || "").trim(),
    country: String(body.country).trim(),
    products: String(body.products || "").trim(),
    quantity: String(body.quantity || "").trim(),
    message: String(body.message).trim(),
    createdAt: new Date().toISOString(),
  };
  await persistEnquiry(record);
  return NextResponse.json({ ok: true, ref });
}
