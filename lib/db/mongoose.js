// ============================================================================
// MongoDB connection (Mongoose) — cached across hot-reloads & serverless calls.
// A single connection promise is memoised on `globalThis` so Next.js dev reloads
// and serverless invocations reuse one pool instead of opening a socket per call.
// ============================================================================
import mongoose from "mongoose";

const URI = process.env.MONGODB_URI;

// Reuse the cache object across module reloads in dev.
const cache = globalThis.__mongoose ?? (globalThis.__mongoose = { conn: null, promise: null });

/**
 * Connect to MongoDB (idempotent). Throws if MONGODB_URI is missing so callers
 * fail loudly rather than silently running against no database.
 * @returns {Promise<typeof mongoose>}
 */
export async function dbConnect() {
  if (cache.conn) return cache.conn;
  if (!URI) throw new Error("MONGODB_URI is not set — add it to .env.local");

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(URI, {
      bufferCommands: false,
      maxPoolSize: 10,
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

/** True when a database URI is configured (used to allow UI-only DEMO_MODE). */
export function hasDatabase() {
  return Boolean(URI);
}
