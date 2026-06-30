// Supplier onboarding endpoint (backend-ready placeholder).
// Validates server-side and returns an application reference. Document files are
// captured by name only here; wire `persistApplication` + object storage when ready.
import { NextResponse } from "next/server";

const required = ["company", "contactName", "email", "phone"];
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
const isGST = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(String(v || "").trim().toUpperCase());

async function persistApplication(record) {
  // TODO(backend): persist to DB, queue KYC/verification, upload documents to
  // object storage (presigned URLs), notify partnerships@awishclinic.com.
  console.log("[supplier-application] received", record.ref, record.company);
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }); }

  const missing = required.filter((k) => !String(body?.[k] || "").trim());
  if (missing.length) return NextResponse.json({ ok: false, error: `Missing: ${missing.join(", ")}` }, { status: 422 });
  if (!isEmail(body.email)) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 422 });
  if (body.gst && !isGST(body.gst)) return NextResponse.json({ ok: false, error: "Invalid GSTIN" }, { status: 422 });

  const ref = "SUP-" + Date.now().toString(36).toUpperCase();
  const record = {
    ref,
    type: "supplier-application",
    company: String(body.company).trim(),
    contactName: String(body.contactName).trim(),
    email: String(body.email).trim(),
    phone: String(body.phone).trim(),
    gst: String(body.gst || "").trim().toUpperCase(),
    city: String(body.city || "").trim(),
    website: String(body.website || "").trim(),
    categories: Array.isArray(body.categories) ? body.categories : [],
    documents: {
      gstCertificate: String(body.gstCertificate || "").trim(),
      catalogue: String(body.catalogue || "").trim(),
    },
    notes: String(body.notes || "").trim(),
    status: "pending_verification",
    createdAt: new Date().toISOString(),
  };
  await persistApplication(record);
  return NextResponse.json({ ok: true, ref });
}
