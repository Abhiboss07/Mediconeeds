// ============================================================================
// SELLER API (mock transport layer) — Phase 15 seam.
// Every function simulates a network round-trip and returns the same shape a
// real REST/GraphQL endpoint will. To go live, replace the bodies with `fetch`
// calls to the backend; signatures and return shapes stay identical, so the
// store + components need zero changes.
//
//   Example real impl:
//     export const createProduct = (p) =>
//       postJSON("/api/seller/products", p);
// ============================================================================
import { postJSON } from "@/lib/forms";

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const ref = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

/** Submit a seller onboarding application. Real: POST /api/seller/apply */
export async function submitSellerApplication(payload) {
  // Uses the existing API route so submission is genuinely wired (not faked).
  return postJSON("/api/seller-application", payload);
}

/** Create a product listing. Real: POST /api/seller/products */
export async function createProduct(product) {
  await delay();
  return { ok: true, id: ref("P"), status: "pending", ...product };
}

/** Bulk import via CSV. Real: POST /api/seller/products/import (multipart) */
export async function importProductsCsv(rowCount) {
  await delay(900);
  return { ok: true, imported: rowCount, ref: ref("IMP") };
}

/** Update order fulfilment. Real: PATCH /api/seller/orders/:id */
export async function updateOrder(id, patch) {
  await delay(400);
  return { ok: true, id, ...patch };
}

/** Request a payout. Real: POST /api/seller/settlements/withdraw */
export async function requestWithdrawal(amount) {
  await delay(700);
  return { ok: true, ref: ref("WD"), amount, eta: "2–3 business days" };
}

/** Raise a support ticket. Real: POST /api/seller/support/tickets */
export async function createTicket(payload) {
  await delay(500);
  return { ok: true, id: ref("TKT"), ...payload };
}
