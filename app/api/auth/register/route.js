// ============================================================================
// Customer signup. Creates a "buyer" User with a bcrypt-hashed password.
// Does NOT sign the user in — the client calls Auth.js signIn() afterwards.
// ============================================================================
import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { User } from "@/lib/db/models/User";
import { SignupSchema, fieldErrors } from "@/lib/auth/validation";

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });
  }
  const { name, email, phone, password } = parsed.data;

  try {
    await dbConnect();

    // Uniqueness check up front for a friendly message (unique index is the guard).
    const existing = await User.exists({ email });
    if (existing) {
      return NextResponse.json({ ok: false, errors: { email: "An account with this email already exists" } }, { status: 409 });
    }

    const user = new User({ name, email, phone: phone || undefined, role: "buyer" });
    await user.setPassword(password);
    await user.save();

    return NextResponse.json({ ok: true, userId: String(user._id) }, { status: 201 });
  } catch (err) {
    // Duplicate-key race → 409; anything else → 500 without leaking internals.
    if (err?.code === 11000) {
      return NextResponse.json({ ok: false, errors: { email: "An account with this email already exists" } }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "Could not create account. Please try again." }, { status: 500 });
  }
}
