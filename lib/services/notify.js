// ============================================================================
// notify() — the single entry point for raising a user notification. It writes
// an in-app Notification and, when an `email` recipient is given, also sends an
// email via the SMTP service (console fallback in dev). Failures never throw so
// callers (checkout, admin decisions, …) aren't blocked by delivery issues.
// ============================================================================
import "server-only";
import { dbConnect } from "@/lib/db/mongoose";
import { Notification } from "@/lib/db/models/Notification";
import { sendEmail } from "@/lib/services/email";

/**
 * @param {{ userId: any, type?: string, title: string, body?: string, link?: string, email?: string }} n
 */
export async function notify({ userId, type = "system", title, body = "", link = "", email }, session = null) {
  try {
    await dbConnect();
    const doc = await Notification.create([{ user: userId, type, title, body, link }], session ? { session } : {});
    if (email) {
      sendEmail({ to: email, subject: title, text: body || title, html: `<p><b>${title}</b></p>${body ? `<p>${body}</p>` : ""}` }).catch(() => {});
    }
    return doc[0];
  } catch (err) {
    console.error("In-app notification creation failed:", err);
    return null;
  }
}
