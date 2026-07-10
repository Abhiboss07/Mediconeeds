// Shared client helpers for the auth forms.

/** Decide whether an identifier is an email or a phone number. */
export function detectChannel(identifier) {
  return /@/.test(identifier) ? "email" : "sms";
}

/** Where to send a user after login, based on role + seller approval. */
export function landingFor(role, sellerStatus) {
  if (role === "admin" || role === "superadmin") return "/admin";
  if (role === "seller") return sellerStatus === "approved" ? "/seller/dashboard" : "/seller/pending";
  return "/account";
}

export async function postJSON(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, ...data };
}

/** Read the current session after a redirect:false signIn. */
export async function fetchSession() {
  try { return await (await fetch("/api/auth/session")).json(); } catch { return null; }
}
