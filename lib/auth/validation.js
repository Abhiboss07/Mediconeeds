// ============================================================================
// Server-side input validation (zod). The single source of truth for what the
// API accepts — client forms may validate too, but the server never trusts them.
// ============================================================================
import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const SignupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Enter a valid phone").optional().or(z.literal("")),
  password,
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Seller application — mirrors the 6-step RegisterWizard field names.
export const SellerApplicationSchema = z.object({
  company: z.string().trim().min(2, "Company name required").max(120),
  owner: z.string().trim().min(2, "Owner name required").max(80),
  email: z.string().trim().toLowerCase().email("Valid email required"),
  mobile: z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, "Valid mobile required"),
  password,
  gst: z.string().trim().toUpperCase().regex(/^[0-9A-Z]{15}$/, "Valid 15-char GSTIN required").optional().or(z.literal("")),
  pan: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Valid PAN required").optional().or(z.literal("")),
  cin: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  bankName: z.string().trim().optional().or(z.literal("")),
  account: z.string().trim().optional().or(z.literal("")),
  ifsc: z.string().trim().toUpperCase().optional().or(z.literal("")),
  categories: z.array(z.string()).default([]),
});

/** Flatten a ZodError into { field: message } for form display. */
export function fieldErrors(err) {
  const out = {};
  for (const issue of err.issues) out[issue.path[0]] = issue.message;
  return out;
}
