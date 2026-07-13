// Auth.js request handlers (sign-in, callback, session, csrf, sign-out).
// The password-login callback is wrapped with a brute-force guard (SEC-01):
// failed attempts per account + per IP are counted and, past the threshold, the
// request is rejected with HTTP 429 before Auth.js runs. A successful login
// clears the counters.
import { NextResponse } from "next/server";
import { handlers } from "@/auth";
import { checkLogin, recordLoginFailure, resetLogin } from "@/lib/auth/login-guard";

export const GET = handlers.GET;

function clientIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req) {
  const { pathname } = new URL(req.url);
  if (!pathname.endsWith("/callback/credentials")) return handlers.POST(req);

  // Read a CLONE of the body to key the guard on the email — the original
  // NextRequest (which Auth.js needs, incl. `.nextUrl`) stays intact and its
  // body unread.
  let email = "";
  try { email = (new URLSearchParams(await req.clone().text()).get("email") || "").toLowerCase().trim(); } catch { /* ignore */ }
  const ip = clientIp(req);

  const gate = checkLogin(ip, email);
  if (gate.locked) {
    const mins = Math.ceil(gate.retryAfter / 60);
    return NextResponse.json(
      { error: "TooManyAttempts", message: `Too many failed sign-in attempts. Please try again in about ${mins} minute${mins === 1 ? "" : "s"}.`, retryAfter: gate.retryAfter },
      { status: 429, headers: { "retry-after": String(gate.retryAfter) } }
    );
  }

  const res = await handlers.POST(req);

  // A session-token cookie in the response means the credentials were correct.
  const setCookie = res.headers.get("set-cookie") || "";
  const success = /(authjs|next-auth)\.session-token=(?!;|\s*$)/.test(setCookie);
  if (success) resetLogin(ip, email);
  else recordLoginFailure(ip, email);
  return res;
}
