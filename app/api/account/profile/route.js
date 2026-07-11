// ============================================================================
// Buyer profile — read + edit personal information for the current buyer.
// Email is immutable here (it's the login identity); everything else is editable.
// ============================================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { USER_GENDERS } from "@/lib/db/models/User";
import { currentBuyer } from "@/lib/account/current";

function view(u) {
  return {
    name: u.name || "",
    email: u.email || "",
    phone: u.phone || "",
    gender: u.gender || "unspecified",
    dob: u.dob ? new Date(u.dob).toISOString().slice(0, 10) : "",
    avatarUrl: u.avatarUrl || "",
    rewardPoints: u.rewardPoints || 0,
  };
}

const Patch = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  gender: z.enum(USER_GENDERS).optional(),
  dob: z.string().trim().optional().or(z.literal("")), // YYYY-MM-DD or ""
});

export async function GET() {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ ok: true, profile: view(buyer) });
}

export async function PATCH(req) {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  let json;
  try { json = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = Patch.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Enter valid details." }, { status: 422 });
  const d = parsed.data;

  await dbConnect();
  if (d.name !== undefined) buyer.name = d.name;
  if (d.phone !== undefined) buyer.phone = d.phone;
  if (d.gender !== undefined) buyer.gender = d.gender;
  if (d.dob !== undefined) {
    const parsedDate = d.dob ? new Date(d.dob) : null;
    buyer.dob = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null;
  }
  await buyer.save();
  return NextResponse.json({ ok: true, profile: view(buyer) });
}

// Soft-delete: mark the account deleted (blocks sign-in via isSignInBlocked).
// The client signs the user out immediately after a 200.
export async function DELETE() {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
  await dbConnect();
  buyer.status = "deleted";
  await buyer.save();
  return NextResponse.json({ ok: true });
}
