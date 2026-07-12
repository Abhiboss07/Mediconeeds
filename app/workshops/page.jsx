import SiteChrome from "@/components/SiteChrome";
import WorkshopsView from "@/components/WorkshopsView";
import { dbConnect } from "@/lib/db/mongoose";
import { Workshop, WorkshopRegistration } from "@/lib/db/models/Workshop";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Workshops — Dr Awish Clinic",
  description: "Hands-on dermatology and clinical skincare workshops by Dr Awish and expert faculty. Register for upcoming cohorts.",
};

// Program-level copy for the About / Benefits / FAQ sections (page content, not
// per-event data — the event cards themselves are database-driven).
const BENEFITS = [
  "Supervised hands-on practice on real cases and models",
  "Evidence-based protocols, checklists and downloadable resources",
  "Small cohorts with direct mentoring from Dr Awish & faculty",
  "Certificate of participation for your practice records",
  "Peer network of dermatologists and clinic owners",
];

const FAQS = [
  { q: "Who can attend these workshops?", a: "Practising dermatologists, aesthetic physicians, MBBS/MD doctors and clinic owners. Some sessions have prerequisites noted in the workshop details." },
  { q: "Do I get a certificate?", a: "Yes — every participant receives a certificate of participation. Select workshops also carry CPD credits." },
  { q: "What is included in the fee?", a: "The registration fee covers all training materials, hands-on kits used during the session, refreshments and your certificate." },
  { q: "What is the refund policy?", a: "Full refund up to 7 days before the workshop date. Within 7 days, your seat can be transferred to a future cohort." },
  { q: "Can you run a private workshop for our clinic?", a: "Absolutely. We run on-site cohorts for hospitals and clinic groups — reach out via the contact page with your requirement." },
];

async function getWorkshops() {
  await dbConnect();
  const docs = await Workshop.find({ published: true }).sort({ startsAt: 1 }).lean();
  const counts = await WorkshopRegistration.aggregate([{ $group: { _id: "$workshop", n: { $sum: 1 } } }]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  const now = Date.now();

  const shape = (w) => ({
    id: String(w._id),
    title: w.title,
    slug: w.slug,
    summary: w.summary || "",
    startsAt: (w.startsAt ? new Date(w.startsAt) : new Date()).toISOString(),
    durationLabel: w.durationLabel || "",
    venue: w.venue || "",
    city: w.city || "",
    price: w.price || 0,
    seatsTotal: w.seatsTotal || 0,
    seatsLeft: Math.max(0, (w.seatsTotal || 0) - (countMap[String(w._id)] || 0)),
    image: w.image || "",
  });

  const upcoming = [], past = [];
  for (const w of docs) (new Date(w.startsAt).getTime() >= now ? upcoming : past).push(shape(w));
  past.reverse();
  return { upcoming, past };
}

export default async function WorkshopsPage() {
  const { upcoming, past } = await getWorkshops();
  return (
    <SiteChrome
      content={<WorkshopsView upcoming={upcoming} past={past} benefits={BENEFITS} faqs={FAQS} />}
      showBottomNav
    />
  );
}
