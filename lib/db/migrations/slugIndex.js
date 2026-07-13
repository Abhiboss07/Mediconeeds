// ============================================================================
// Reusable slug-index migration (callable from an API route or a script).
// Replaces the plain unique {seller,slug} index with a PARTIAL unique index
// scoped to live (non-deleted) products, so a seller can re-create a product
// with the same name/slug after deleting one. Idempotent + safe.
// See scripts/migrate-slug-index.mjs for the standalone CLI equivalent.
// ============================================================================
import { dbConnect } from "@/lib/db/mongoose";
import { Product } from "@/lib/db/models/Product";

const IDX_NAME = "seller_1_slug_1";
const PARTIAL = { deleted: false };

const isPartialDeletedFalse = (idx) => {
  const p = idx?.partialFilterExpression;
  return !!p && Object.keys(p).length === 1 && p.deleted === false;
};
const shape = (idx) => (idx ? { unique: !!idx.unique, partial: idx.partialFilterExpression || null } : null);

/**
 * Run the migration against the currently-configured database.
 * @returns {Promise<object>} result with before/after index shapes and flags.
 */
export async function migrateSlugIndex() {
  await dbConnect();
  const col = Product.collection;

  // 1) Normalise legacy docs missing `deleted` so they stay in the partial index.
  const normalized = (await col.updateMany({ deleted: { $exists: false } }, { $set: { deleted: false } })).modifiedCount;

  // 2) Inspect the current {seller,slug} index.
  const before = shape((await col.indexes()).find((i) => i.name === IDX_NAME));

  if (before && before.unique && before.partial && before.partial.deleted === false) {
    return { success: true, alreadyMigrated: true, oldIndexRemoved: false, newIndexCreated: false, duplicates: 0, normalized, before, after: before };
  }

  // 3) Guard: a unique build fails if duplicate LIVE (seller,slug) pairs exist.
  const dupes = await col.aggregate([
    { $match: { deleted: false } },
    { $group: { _id: { seller: "$seller", slug: "$slug" }, n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
    { $limit: 20 },
  ]).toArray();
  if (dupes.length) {
    return {
      success: false, error: "Duplicate LIVE (seller,slug) pairs exist — resolve then re-run.",
      duplicates: dupes.length, duplicateSamples: dupes.map((d) => ({ ...d._id, seller: String(d._id.seller), n: d.n })),
      oldIndexRemoved: false, newIndexCreated: false, normalized, before,
    };
  }

  // 4) Drop the old plain index (if present) and build the partial one.
  const oldIndexRemoved = !!before;
  if (before) await col.dropIndex(IDX_NAME);
  await col.createIndex({ seller: 1, slug: 1 }, { name: IDX_NAME, unique: true, partialFilterExpression: PARTIAL });

  const after = shape((await col.indexes()).find((i) => i.name === IDX_NAME));
  return { success: true, alreadyMigrated: false, oldIndexRemoved, newIndexCreated: true, duplicates: 0, normalized, before, after };
}
