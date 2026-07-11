// ============================================================================
// Display-identity helpers — how a user's name/avatar is shown in the navbar,
// account sidebar, etc. Plain JS (no server-only imports) so both client and
// server components can share one source of truth.
//
// Rule: passwordless signups get `name === email` (we have no real name yet).
// We must NEVER render the full email in the UI — fall back to a single letter.
// ============================================================================

/** True when we have no real human name (missing, blank, or equal to / is an email). */
function nameIsEmailish(name, email) {
  const n = String(name || "").trim();
  if (!n) return true;
  if (/@/.test(n)) return true; // an email address, not a name
  if (email && n.toLowerCase() === String(email).toLowerCase()) return true;
  return false;
}

/** The email/name local part (before the @), used to derive an initial. */
function localPart(user) {
  const src = String(user?.email || user?.name || "").trim();
  return (src.split("@")[0] || "").replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * The greeting shown in the navbar, e.g. "Hi, {greetingName(user)}".
 * - Real name → first name ("Rahul").
 * - Only an email → the capitalised first letter ("P"), never the full email.
 */
export function greetingName(user) {
  if (!user) return "Guest";
  if (nameIsEmailish(user.name, user.email)) {
    const lp = localPart(user);
    return (lp[0] || "U").toUpperCase();
  }
  return String(user.name).trim().split(/\s+/)[0];
}

/**
 * 1–2 character avatar initials.
 * - "Rahul Sharma" → "RS"; "Rahul" → "R".
 * - email-only → first letter of the local part ("P").
 */
export function avatarInitials(user) {
  if (!user) return "U";
  if (nameIsEmailish(user.name, user.email)) {
    const lp = localPart(user);
    return (lp[0] || "U").toUpperCase();
  }
  const parts = String(user.name).trim().split(/\s+/);
  const two = (parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  return (two || parts[0]?.[0] || "U").toUpperCase();
}
