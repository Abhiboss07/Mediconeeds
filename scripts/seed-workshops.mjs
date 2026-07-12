// ============================================================================
// Seed dermatology/skincare workshops for the public /workshops page.
// Idempotent: upserts by slug. Dates are relative to "now" so the upcoming/past
// split stays sensible whenever it's run.
//   node --env-file=.env.local scripts/seed-workshops.mjs
// ============================================================================
import mongoose from "mongoose";
import { Workshop } from "../lib/db/models/Workshop.js";

const { MONGODB_URI } = process.env;
if (!MONGODB_URI) { console.error("✗ MONGODB_URI not set"); process.exit(1); }

const day = 864e5;
const at = (d) => new Date(Date.now() + d * day);

const items = [
  {
    title: "Advanced Chemical Peels Masterclass", slug: "advanced-chemical-peels",
    summary: "Deep-dive into superficial to medium-depth peels, indications, layering and complication management.",
    description: "A full-day intensive covering peel chemistry, patient selection, priming, application technique and post-peel care with live demonstrations.",
    startsAt: at(21), durationLabel: "1 day", venue: "Dr Awish Clinic, Bandra", city: "Mumbai", price: 12500, seatsTotal: 24,
    highlights: ["Live demos", "Hands-on practice", "Complication management"],
  },
  {
    title: "Aesthetic Injectables: Botox & Fillers", slug: "aesthetic-injectables",
    summary: "Facial anatomy, injection planes, dosing and natural-looking results for toxins and dermal fillers.",
    description: "Two-day hands-on training on neuromodulators and hyaluronic-acid fillers, with cadaver-model anatomy and supervised patient sessions.",
    startsAt: at(40), durationLabel: "2 days", venue: "Grand Hyatt", city: "Mumbai", price: 28000, seatsTotal: 20,
    highlights: ["Facial anatomy", "Live patients", "Dosing protocols"],
  },
  {
    title: "Acne & Scar Management Workshop", slug: "acne-scar-management",
    summary: "Evidence-based acne protocols, scar grading and combination treatments including microneedling & subcision.",
    description: "A practical session on building an acne and scar practice — from grading to combination device and procedural therapy.",
    startsAt: at(65), durationLabel: "1 day", venue: "Online + Clinic", city: "Hybrid", price: 9500, seatsTotal: 40,
    highlights: ["Subcision", "Microneedling", "Protocols"],
  },
  {
    title: "Lasers in Dermatology Foundation", slug: "lasers-foundation",
    summary: "Laser physics, tissue interaction and safe parameter selection across common dermatology platforms.",
    description: "Foundation course on laser-tissue interaction, device selection and safety.",
    startsAt: at(-30), durationLabel: "1 day", venue: "Dr Awish Clinic, Bandra", city: "Mumbai", price: 11000, seatsTotal: 24,
    highlights: ["Laser physics", "Safety"],
  },
  {
    title: "Cosmeceuticals & Skin Barrier Science", slug: "cosmeceuticals-barrier",
    summary: "Formulation science, actives and building a results-driven skincare regimen for patients.",
    description: "How cosmeceutical actives work and how to prescribe them effectively.",
    startsAt: at(-75), durationLabel: "Half day", venue: "Online", city: "Online", price: 4500, seatsTotal: 100,
    highlights: ["Actives", "Regimen building"],
  },
];

const benefits = [
  "Supervised hands-on practice",
  "Downloadable protocols & checklists",
  "Certificate of participation",
];
const faqs = [
  { q: "Is this workshop hands-on?", a: "Yes, every session includes supervised hands-on practice." },
  { q: "Do I need prior experience?", a: "Basic clinical experience is recommended; prerequisites are listed per workshop." },
];

await mongoose.connect(MONGODB_URI);
let created = 0, updated = 0;
for (const it of items) {
  const res = await Workshop.updateOne(
    { slug: it.slug },
    { $set: { ...it, benefits, faqs, published: true } },
    { upsert: true }
  );
  if (res.upsertedCount) created++; else updated++;
}
console.log(`✓ Workshops — created: ${created}, updated: ${updated}, total: ${await Workshop.countDocuments()}`);
await mongoose.disconnect();
process.exit(0);
