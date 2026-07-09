// ============================================================================
// Seller onboarding endpoint. Persists the application to MongoDB as a PENDING
// Seller linked to a seller User that has no usable password yet. The account
// stays unusable until an admin approves it and the seller sets a password via
// the emailed invite (set-password flow). Field names match the RegisterWizard
// client (gstin/phone/bank.name) so the approved UI is untouched.
// ============================================================================
import { NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { Seller } from "@/lib/db/models/Seller";

const required = ["company", "owner", "email", "phone", "gstin", "pan"];
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
const isGST = (v) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(String(v || "").trim().toUpperCase());

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 }); }

  const missing = required.filter((k) => !String(body?.[k] || "").trim());
  if (missing.length) return NextResponse.json({ ok: false, error: `Missing: ${missing.join(", ")}` }, { status: 422 });
  if (!isEmail(body.email)) return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 422 });
  if (!isGST(body.gstin)) return NextResponse.json({ ok: false, error: "Invalid GSTIN" }, { status: 422 });

  const email = String(body.email).trim().toLowerCase();
  const ref = "SLR-" + Date.now().toString(36).toUpperCase();

  try {
    await dbConnect();

    // Block duplicate applications / existing accounts on the same email.
    const existingUser = await User.findOne({ email }).select("_id role").lean();
    if (existingUser) {
      const already = await Seller.exists({ user: existingUser._id });
      return NextResponse.json(
        { ok: false, error: already ? "An application already exists for this email." : "An account already exists for this email." },
        { status: 409 }
      );
    }

    // Create the seller User with an unusable random password (set on approval).
    const user = new User({ name: String(body.owner).trim(), email, phone: String(body.phone).trim(), role: "seller" });
    await user.setPassword(crypto.randomBytes(24).toString("hex"));
    await user.save();

    await Seller.create({
      user: user._id,
      company: String(body.company).trim(),
      owner: String(body.owner).trim(),
      email,
      mobile: String(body.phone).trim(),
      gst: String(body.gstin).trim().toUpperCase(),
      pan: String(body.pan).trim().toUpperCase(),
      cin: String(body.cin || "").trim(),
      address: String(body.address || "").trim(),
      website: String(body.website || "").trim(),
      categories: Array.isArray(body.categories) ? body.categories : [],
      bank: {
        bankName: String(body.bank?.name || "").trim(),
        account: String(body.bank?.account || "").trim(),
        ifsc: String(body.bank?.ifsc || "").trim().toUpperCase(),
      },
      documents: {
        gstCert: body.documents?.gstCert || undefined,
        panDoc: body.documents?.pan_doc || undefined,
        cheque: body.documents?.cheque || undefined,
        license: body.documents?.license || undefined,
      },
      approval: "pending",
      applicationRef: ref,
    });

    // TODO(email): notify admin queue + acknowledge the applicant. See docs/AUTH.md.
    return NextResponse.json({ ok: true, ref });
  } catch (err) {
    if (err?.code === 11000) {
      return NextResponse.json({ ok: false, error: "An account already exists for this email." }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Could not submit application. Please try again." }, { status: 500 });
  }
}
