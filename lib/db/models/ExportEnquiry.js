import mongoose from "mongoose";

const { Schema } = mongoose;

const ExportEnquirySchema = new Schema(
  {
    ref: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    company: { type: String },
    country: { type: String, required: true },
    products: { type: String },
    quantity: { type: String },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const ExportEnquiry = mongoose.models.ExportEnquiry || mongoose.model("ExportEnquiry", ExportEnquirySchema);
