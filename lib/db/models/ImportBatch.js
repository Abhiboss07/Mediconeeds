// ============================================================================
// ImportBatch — one seller bulk-upload job. Created at validation time with the
// parsed + validated rows, then updated as rows are published (chunked) into
// pending Products. Drives the Import History screen, the downloadable error
// report, and "retry failed rows". Row payloads are stored so a failed row can
// be re-imported without re-uploading the file.
// ============================================================================
import mongoose from "mongoose";

const { Schema } = mongoose;

export const IMPORT_STATUSES = ["validated", "importing", "completed", "partial", "failed"];
export const ROW_STATUSES = ["valid", "warning", "error", "pending", "success", "failed", "skipped"];

const RowSchema = new Schema(
  {
    rowIndex: { type: Number, required: true }, // 1-based data row (matches the CSV row the seller sees)
    data: { type: Schema.Types.Mixed, default: {} }, // normalised field values (name, sku, price, images[], …)
    status: { type: String, enum: ROW_STATUSES, default: "valid" },
    // `issues` (not `errors`) — `errors` is a reserved Mongoose document path.
    issues: { type: [String], default: [] },
    warnings: { type: [String], default: [] },
    reason: { type: String, default: "" }, // failure reason for the error report
    product: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    sku: { type: String, default: "" },
    name: { type: String, default: "" },
  },
  { _id: false }
);

const ImportBatchSchema = new Schema(
  {
    seller: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    sellerName: { type: String, default: "" },
    filename: { type: String, default: "" },
    source: { type: String, default: "csv" }, // csv | xlsx
    hasImagesZip: { type: Boolean, default: false },

    status: { type: String, enum: IMPORT_STATUSES, default: "validated", index: true },
    counts: {
      total: { type: Number, default: 0 },
      valid: { type: Number, default: 0 },
      warnings: { type: Number, default: 0 },
      errors: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
    },

    rows: { type: [RowSchema], default: [] },

    // If this batch is a retry of a previous one.
    retryOf: { type: Schema.Types.ObjectId, ref: "ImportBatch", default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const ImportBatch = mongoose.models.ImportBatch || mongoose.model("ImportBatch", ImportBatchSchema);
