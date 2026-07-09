"use client";
// ============================================================================
// SELLER STORE — client-side state for the seller portal.
// Products are now API-backed (MongoDB via /api/seller/products): the store
// hydrates from the server on mount and every mutation calls the API, then
// resyncs so the UI reflects server truth (e.g. edits routed back to "pending").
// Orders / notifications / analytics remain seeded for now (wired in the order
// & analytics phases). Action signatures are unchanged so screens don't change.
// ============================================================================
import { useSyncExternalStore, useEffect } from "react";
import seed from "@/data/seller/seed.json";

let state = JSON.parse(JSON.stringify(seed));
let hydrated = false;
let ordersHydrated = false;
let notifsHydrated = false;
const listeners = new Set();

const emit = () => { state = { ...state }; listeners.forEach((l) => l()); };
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;
const getServerSnapshot = () => state;

export function useSellerStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ---------------- Hydration ----------------
export async function hydrateProducts(force = false) {
  if (hydrated && !force) return;
  hydrated = true;
  try {
    const r = await (await fetch("/api/seller/products")).json();
    if (r.ok && Array.isArray(r.products)) { state.products = r.products; emit(); }
  } catch { /* keep whatever we have */ }
}

export async function hydrateOrders(force = false) {
  if (ordersHydrated && !force) return;
  ordersHydrated = true;
  try {
    const r = await (await fetch("/api/seller/orders")).json();
    if (r.ok && Array.isArray(r.orders)) { state.orders = r.orders; emit(); }
  } catch { /* keep seeded */ }
}

export async function hydrateNotifications(force = false) {
  if (notifsHydrated && !force) return;
  notifsHydrated = true;
  try {
    const r = await (await fetch("/api/seller/notifications")).json();
    if (r.ok && Array.isArray(r.notifications)) { state.notifications = r.notifications; emit(); }
  } catch { /* keep seeded */ }
}

/** Call once from a top-level seller screen (SellerShell) to load real data. */
export function useHydrateSeller() {
  useEffect(() => { hydrateProducts(); hydrateOrders(); hydrateNotifications(); }, []);
}

const jsonFetch = (url, method, body) =>
  fetch(url, { method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined });

// Map a store product (which may carry UI-only fields) to the API payload shape.
function toApi(p) {
  const out = {};
  for (const k of ["name", "brand", "sku", "category", "hsn", "gst", "mrp", "price", "wholesale", "moq", "stock", "description", "shortDescription", "status"])
    if (p[k] !== undefined) out[k] = p[k];
  if (p.images) out.images = p.images;
  else if (p.image) out.images = [p.image];
  if (p.metaTitle || p.metaDescription) out.seo = { title: p.metaTitle, description: p.metaDescription };
  return out;
}

// ---------------- Products (API-backed) ----------------
export async function addProduct(p) {
  const tmpId = "tmp-" + Date.now();
  state.products = [{ id: tmpId, views: 0, sales: 0, rating: 0, status: p.status || "pending", ...p }, ...state.products];
  emit();
  try {
    const r = await (await jsonFetch("/api/seller/products", "POST", toApi(p))).json();
    if (r.ok && r.id) { await hydrateProducts(true); return r.id; }
  } catch { /* fall through to resync */ }
  await hydrateProducts(true);
  return null;
}

export async function updateProduct(id, patch) {
  state.products = state.products.map((p) => (p.id === id ? { ...p, ...patch } : p));
  emit();
  try { await jsonFetch(`/api/seller/products/${id}`, "PATCH", toApi(patch)); } catch {}
  await hydrateProducts(true);
}

export function setProductStatus(id, status) { return updateProduct(id, { status }); }

export async function deleteProduct(id) {
  state.products = state.products.filter((p) => p.id !== id);
  emit();
  try { await jsonFetch(`/api/seller/products/${id}`, "DELETE"); } catch {}
  await hydrateProducts(true);
}

export async function duplicateProduct(id) {
  const src = state.products.find((p) => p.id === id);
  if (!src) return;
  await addProduct({ ...src, id: undefined, name: src.name + " (Copy)", sku: (src.sku || "SKU") + "-C", status: "draft" });
}

export async function updateStock(id, stock) {
  const val = Math.max(0, Number(stock) || 0);
  state.products = state.products.map((p) => (p.id === id ? { ...p, stock: val } : p));
  emit();
  try { await jsonFetch(`/api/seller/products/${id}`, "PATCH", { stock: val }); } catch {}
}

// ---------------- Orders (API-backed) ----------------
export async function advanceOrder(id) {
  state.orders = state.orders.map((o) => {
    if (o.id !== id) return o;
    const flow = ["new", "confirmed", "packed", "shipped", "delivered"];
    const i = flow.indexOf(o.status);
    return i >= 0 && i < flow.length - 1 ? { ...o, status: flow[i + 1] } : o;
  });
  emit();
  try { await jsonFetch(`/api/seller/orders/${id}`, "POST", { action: "advance" }); } catch {}
  await hydrateOrders(true);
}

// ---------------- Notifications (API-backed) ----------------
export async function markAllRead() {
  state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
  emit();
  try { await jsonFetch("/api/seller/notifications", "POST", { action: "markAll" }); } catch {}
  await hydrateNotifications(true);
}
export async function toggleRead(id) {
  state.notifications = state.notifications.map((n) => (n.id === id ? { ...n, read: !n.read } : n));
  emit();
  try { await jsonFetch("/api/seller/notifications", "POST", { action: "toggle", id }); } catch {}
  await hydrateNotifications(true);
}

// ---------------- Derived selectors ----------------
export function dashboardStats(s) {
  const products = s.products;
  const orders = s.orders;
  const active = products.filter((p) => p.status === "active");
  const pending = products.filter((p) => p.status === "pending");
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10);
  const outStock = products.filter((p) => p.stock === 0 && p.status === "active");
  const revenue = s.analytics.revenueMonthly.reduce((a, b) => a + b.val, 0);
  const openOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  return {
    totalProducts: products.length,
    activeListings: active.length,
    pendingApproval: pending.length,
    orders: orders.length,
    openOrders: openOrders.length,
    revenue,
    visitors: s.analytics.visitors,
    conversion: s.analytics.conversion,
    lowStock,
    outStock,
    totalUnitsSold: products.reduce((a, p) => a + (p.sales || 0), 0),
  };
}
