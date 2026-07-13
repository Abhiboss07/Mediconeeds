// ============================================================================
// Migration: replace the plain unique {seller, slug} product index with a
// PARTIAL unique index scoped to live (non-deleted) products.
//
// Why: the old `{seller:1, slug:1} unique:true` index also counted
// soft-deleted tombstones, so once a seller deleted a product its slug stayed
// reserved forever — re-creating it (bulk upload OR manual Add Product) failed
// with E11000 duplicate key. The partial filter `{ deleted: false }` keeps
// tombstones out of the index while still enforcing uniqueness among live
// products.
//
// Safe + idempotent. Run once per database. It connects to whatever
// MONGODB_URI resolves to — it PRINTS the target host first so you can confirm
// you are pointed at production before it makes changes.
//
//   # against production (recommended — set the prod URI explicitly):
//   MONGODB_URI='mongodb+srv://…prod…' node scripts/migrate-slug-index.mjs
//
//   # or, if .env.local already holds the prod URI:
//   node scripts/migrate-slug-index.mjs
// ============================================================================
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

const IDX_NAME = "seller_1_slug_1";
const PARTIAL = { deleted: false };

function resolveUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI.trim();
  const envPath = path.join(process.cwd(), ".env.local");
  const m = fs.existsSync(envPath) && fs.readFileSync(envPath, "utf8").match(/MONGODB_URI\s*=\s*(.+)/);
  if (!m || !m[1].trim()) { console.error("No MONGODB_URI in env or .env.local"); process.exit(1); }
  return m[1].trim().replace(/['"]/g, "");
}
const mask = (u) => u.replace(/(\/\/[^:]+:)[^@]+@/, "$1***@");

function isPartialDeletedFalse(idx) {
  const pfe = idx.partialFilterExpression;
  return pfe && Object.keys(pfe).length === 1 && pfe.deleted === false;
}

async function run() {
  const uri = resolveUri();
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  console.log("Connected to:", mask(uri), "\nDatabase:", mongoose.connection.name);
  const col = db.collection("products");

  // 1) Normalise legacy docs missing the `deleted` flag so they stay in the
  //    unique index (partial filter matches `deleted: false` exactly).
  const norm = await col.updateMany({ deleted: { $exists: false } }, { $set: { deleted: false } });
  console.log(`\nNormalised deleted-flag on ${norm.modifiedCount} legacy product(s).`);

  // 2) Inspect the current {seller,slug} index.
  const before = await col.indexes();
  const cur = before.find((i) => i.name === IDX_NAME);
  console.log("Current index:", cur ? JSON.stringify({ unique: cur.unique, partial: cur.partialFilterExpression }) : "(none)");

  if (cur && cur.unique && isPartialDeletedFalse(cur)) {
    console.log("\n✓ Already the partial unique index — nothing to do.");
  } else {
    if (cur) { await col.dropIndex(IDX_NAME); console.log(`Dropped old index "${IDX_NAME}".`); }
    // Guard: if duplicate LIVE slugs exist they would block a unique build.
    const dupes = await col.aggregate([
      { $match: { deleted: false } },
      { $group: { _id: { seller: "$seller", slug: "$slug" }, n: { $sum: 1 } } },
      { $match: { n: { $gt: 1 } } }, { $limit: 5 },
    ]).toArray();
    if (dupes.length) {
      console.error("\n✗ Cannot build unique index — duplicate LIVE (seller,slug) pairs exist:");
      for (const d of dupes) console.error("   ", JSON.stringify(d._id), "x", d.n);
      console.error("Resolve these (delete/rename) then re-run. No index created.");
      await mongoose.disconnect(); process.exit(2);
    }
    await col.createIndex({ seller: 1, slug: 1 }, { name: IDX_NAME, unique: true, partialFilterExpression: PARTIAL });
    console.log(`Created partial unique index "${IDX_NAME}" (partialFilterExpression: { deleted: false }).`);
  }

  const after = (await col.indexes()).find((i) => i.name === IDX_NAME);
  console.log("\nFinal index:", JSON.stringify({ key: after.key, unique: after.unique, partial: after.partialFilterExpression }));
  await mongoose.disconnect();
  console.log("Done.");
}
run().catch((e) => { console.error("MIGRATION FAILED:", e.message); process.exit(1); });
