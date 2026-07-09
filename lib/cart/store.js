"use client";
// ============================================================================
// Storefront cart — client-side, persisted to localStorage so it survives
// reloads and navigation. useSyncExternalStore gives every screen a live view.
// Checkout reads this and POSTs to /api/checkout to create a real Order.
// ============================================================================
import { useSyncExternalStore } from "react";

const KEY = "mn_cart_v1";
const EMPTY = { items: [] }; // stable server snapshot (SSR renders an empty cart)

function load() {
  if (typeof window === "undefined") return EMPTY;
  try { return JSON.parse(localStorage.getItem(KEY)) || { items: [] }; } catch { return { items: [] }; }
}

let state = load();
const listeners = new Set();

function commit(next) {
  state = next;
  try { if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  listeners.forEach((l) => l());
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY;

export function useCart() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function addItem(item, qty = 1) {
  const items = [...state.items];
  const i = items.findIndex((x) => x.id === item.id);
  if (i >= 0) items[i] = { ...items[i], qty: items[i].qty + qty };
  else items.push({ id: item.id, slug: item.slug, name: item.name, image: item.image, price: Number(item.price) || 0, qty });
  commit({ ...state, items });
}

export function setQty(id, qty) {
  const q = Math.max(1, Number(qty) || 1);
  commit({ ...state, items: state.items.map((x) => (x.id === id ? { ...x, qty: q } : x)) });
}

export function removeItem(id) {
  commit({ ...state, items: state.items.filter((x) => x.id !== id) });
}

export function clearCart() { commit({ items: [] }); }

export const cartCount = (s) => s.items.reduce((a, x) => a + x.qty, 0);
export const cartSubtotal = (s) => s.items.reduce((a, x) => a + x.price * x.qty, 0);
