// ============================================================================
// Buyer saved addresses — subdocuments of the current buyer's User. A new
// account has none; there is no seeded/demo address.
// ============================================================================
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiGuard } from "@/lib/auth/session";
import { dbConnect } from "@/lib/db/mongoose";
import { currentBuyer } from "@/lib/account/current";

const AddrInput = z.object({
  label: z.string().trim().max(30).optional(),
  name: z.string().trim().max(80).optional(),
  line: z.string().trim().min(1, "Address is required").max(300),
  phone: z.string().trim().max(20).optional(),
  pincode: z.string().trim().max(10).optional(),
  isDefault: z.boolean().optional(),
});

function list(buyer) {
  return (buyer.addresses || []).map((a) => ({
    id: String(a._id),
    label: a.label || "Home",
    name: a.name || "",
    line: a.line || "",
    phone: a.phone || "",
    pincode: a.pincode || "",
    isDefault: !!a.isDefault,
  }));
}

// If the given address is the default (or it's the only one), clear the flag on
// all others so exactly one default exists.
function normalizeDefaults(buyer, preferId) {
  const addrs = buyer.addresses || [];
  if (!addrs.length) return;
  let target = preferId ? addrs.id(preferId) : null;
  if (target?.isDefault) addrs.forEach((a) => { if (a !== target) a.isDefault = false; });
  if (!addrs.some((a) => a.isDefault)) addrs[0].isDefault = true;
}

export async function GET() {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: true, addresses: [] });
  return NextResponse.json({ ok: true, addresses: list(buyer) });
}

export async function POST(req) {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  let json; try { json = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const parsed = AddrInput.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message || "Invalid address" }, { status: 422 });

  await dbConnect();
  const isFirst = (buyer.addresses || []).length === 0;
  buyer.addresses.push({ ...parsed.data, isDefault: parsed.data.isDefault || isFirst });
  const added = buyer.addresses[buyer.addresses.length - 1];
  normalizeDefaults(buyer, added._id);
  await buyer.save();
  return NextResponse.json({ ok: true, addresses: list(buyer) });
}

export async function PATCH(req) {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  let json; try { json = await req.json(); } catch { return NextResponse.json({ ok: false, error: "Invalid body" }, { status: 400 }); }
  const id = String(json?.id || "");
  const parsed = AddrInput.partial().safeParse(json);
  if (!id || !parsed.success) return NextResponse.json({ ok: false, error: "Invalid address" }, { status: 422 });

  await dbConnect();
  const a = buyer.addresses.id(id);
  if (!a) return NextResponse.json({ ok: false, error: "Address not found" }, { status: 404 });
  for (const k of ["label", "name", "line", "phone", "pincode", "isDefault"]) {
    if (parsed.data[k] !== undefined) a[k] = parsed.data[k];
  }
  normalizeDefaults(buyer, id);
  await buyer.save();
  return NextResponse.json({ ok: true, addresses: list(buyer) });
}

export async function DELETE(req) {
  const g = await apiGuard("buyer");
  if (!g.ok) return NextResponse.json({ ok: false }, { status: g.status });
  const buyer = await currentBuyer();
  if (!buyer) return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 422 });

  await dbConnect();
  const a = buyer.addresses.id(id);
  if (!a) return NextResponse.json({ ok: false, error: "Address not found" }, { status: 404 });
  a.deleteOne();
  normalizeDefaults(buyer);
  await buyer.save();
  return NextResponse.json({ ok: true, addresses: list(buyer) });
}
