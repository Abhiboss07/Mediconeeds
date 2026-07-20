# Mediconeeds — Production Release QA Audit

> **Purpose of this document:** a self-contained audit report you can paste into
> ChatGPT (or any LLM) for a second opinion. It includes the project context,
> stack, methodology, and every finding with reproduction evidence, so the reader
> needs **no access to the source code** to analyze it.
>
> **Audit date:** 2026-07-20
> **Audited build:** local production build (`next build && next start`,
> `NODE_ENV=production`) against the **real MongoDB Atlas** database.
> **Auditor role:** Principal QA / Security / Performance / UX review.

---

## ✅ Remediation status (updated 2026-07-20)

All actionable findings from this report have been fixed and verified at runtime:

| ID | Finding | Status |
|----|---------|--------|
| M-1 | Contact map blocked by CSP | ✅ Fixed — `frame-src` whitelists Google Maps; `/contact` now console-error-free |
| L-1 | Contact API leaks parser error / 500 | ✅ Fixed — isolated parse → 400, 16 KB size guard → 413, zod validation → 422, generic 500 |
| L-2 | Homepage missing structured data | ✅ Fixed — Organization + WebSite + SearchAction JSON-LD added |
| L-3 | Placeholder / dead links | ✅ Fixed — footer "Download App" (`/shop`) block removed; header top-links repointed; **0** dead links |
| L-4 | `/api/health` not DB-aware | ✅ Fixed *(with design correction)* — liveness stays DB-free; new `?ready=1` readiness probe pings Mongo, returns 503 on failure |
| I-1 | Weak DB credentials | ⚠️ **Ops action required** — cannot be fixed in code; rotate Atlas password + IP allow-list |
| I-2 | `<img>` vs `next/image` | ⚠️ **Constrained** — most images live in server-rendered HTML fragments (not JSX), so `next/image` cannot wrap them without rebuilding the clone; tracked as enterprise work |

See the final engineering report (in chat) for before/after evidence.

---

## How to use this with ChatGPT

Suggested prompt to paste **above** this document:

> "You are a Principal Engineer doing a second-pass review of the QA audit below.
> For each finding: (a) do you agree with the severity? (b) is the suggested fix
> correct and complete, or is there a better approach? (c) what did the auditor
> miss? Then give me a prioritized, launch-blocking-vs-nice-to-have action list.
> Challenge any claim you think is optimistic."

---

## 1. Project Context

**Mediconeeds** is a B2B/B2C skincare **marketplace** (storefront brand
"Mediconeeds"; products are the real "Dr Awish" clinical skincare line). It is a
desktop-faithful clone of a Medikabazaar-style layout, rebranded and wired to a
live database with real auth, payments, seller portal, and admin portal.

**Roles:** `guest` → `buyer` → `seller` → `admin` → `superadmin`.

**Three portals:**
- **Buyer** — browse, cart, checkout (COD + Razorpay), orders, invoices, wishlist, account.
- **Seller** — dashboard, products CRUD, inventory, bulk upload (CSV/XLSX + ZIP images), wallet/settlements, withdrawals, GST report. Gated behind admin approval.
- **Admin** — users, sellers (approve/reject), products, orders, withdrawals (mark paid), banners/brands/categories, commission.

## 2. Technology Stack

| Layer | Choice |
|---|---|
| Framework | Next.js `15.5.20` (App Router, RSC), React `19.1.0` |
| Auth | Auth.js (NextAuth v5 beta) — Credentials (email+password) + passwordless OTP + Google |
| Database | MongoDB Atlas via Mongoose 9 |
| Payments | Razorpay (HMAC signature verification) |
| Validation | Zod |
| Styling | Tailwind (prebuilt to `generated.css`), reused clone base CSS |
| Email/SMS | Brevo/SMTP (Nodemailer), OTP delivery |
| Images | Cloudinary configured; **but most `<img>` are raw, not `next/image`** |
| Rendering | ISR (`revalidate: 60`) on catalog pages; `force-dynamic` on account/API |

**Surface area:** 52 API route handlers, 58 page routes.

**Security model:** Edge middleware decodes the JWT session and enforces an RBAC
route→role map as a *fast reject*; server components and route handlers
**independently re-check** (defense-in-depth). `buyer` is enforced as an **exact
role** (sellers/admins cannot use buyer flows); all other roles are hierarchical.
A `DEMO_MODE` rollout flag exists but is **hard-disabled when
`NODE_ENV=production`** (kill-switch) and is secure-by-default otherwise.

## 3. Methodology

Because there is **no hosted production URL**, the app was built and served
exactly as production runs it (`next build && next start`, `NODE_ENV=production`)
and pointed at the **real Atlas database** (47 users, 20 sellers, live catalog).
All results below are from **actual HTTP requests against that running build** or
**direct source inspection** — nothing is inferred or fabricated.

**Techniques used:**
- Static review of auth core, RBAC map, session guards, payment verification, and the most IDOR-prone endpoints.
- Unauthenticated probing of all protected API prefixes (expect `401`/`403`).
- **Authenticated** sessions (real login via NextAuth CSRF + credentials callback) as **seller** (`seller@test.com`) and **admin** (env creds) to test role isolation / privilege escalation.
- Injection/abuse: NoSQL operator injection, ReDoS, malformed/oversized bodies, OTP flooding.
- SEO/meta/structured-data extraction; security-header inspection; 404/405 behavior.
- Headless-browser crawl (Chromium/Playwright) of 14 public pages for console errors, hydration mismatches, page errors, and broken images.

## 4. Coverage & Limitations (what was NOT verified)

These areas are **not** validated and must not be read as passing:

- **Live Razorpay capture** — verification code path reviewed; no real transaction executed.
- **Live email/SMS OTP delivery** — issuance/rate-limit/anti-enumeration verified; inbox delivery not confirmed.
- **Bulk upload at scale** (500–1000 rows, ZIP images) — code reviewed; not load-tested.
- **Accessibility** — automated smoke only (alt text, a11y console errors); **no** screen-reader/AT, contrast, or keyboard-trap testing.
- **Field performance** — build/bundle sizes analyzed; **no** Lighthouse/Web-Vitals (LCP/CLS/TTFB) measurement (needs hosting).
- Not every one of 58 pages / 52 APIs was individually driven; highest-risk surfaces were sampled.

---

## 5. Overall Assessment

- **Overall rating:** **8.2 / 10**
- **Production readiness:** 🟡 **Ready With Minor Fixes** — conditioned on a live
  payment capture + a bulk-upload load test before real traffic.

### Category scores

| Category | Score | Basis |
|---|---|---|
| Security | 9.0 | Full header set, RBAC verified, IDOR-safe, injection-safe, HMAC payments, rate-limited |
| Authentication | 9.0 | Middleware + defense-in-depth, exact-buyer policy, prod DEMO_MODE kill-switch (runtime-verified) |
| Payments | 8.0 | HMAC verify + idempotent + transactional stock decrement (code-verified; no live capture) |
| API | 8.5 | Consistent 401/403/404/405/422; one inconsistent route (contact) |
| Maintainability | 9.0 | Clear architecture, single sources of truth, strong comments |
| Code Quality | 8.5 | Clean build, zod validation, atomic transactions |
| UI | 8.5 | Zero console/hydration errors, zero broken images across 14 pages |
| Admin | 8.0 | Login + authorization verified; not every mutation driven |
| Seller | 8.0 | Auth + portal APIs + approval gate verified |
| SEO | 7.5 | Meta/canonical/OG/Twitter/robots/sitemap present; PDP Product schema; homepage lacks JSON-LD |
| Buyer | 7.5 | Auth + order-scoping verified; full purchase not completed |
| UX | 7.0 | Clean rebrand, but placeholder/dead links in chrome |
| Scalability | 7.0 | ISR + aggregation + transactions; `<img>` unoptimized; single Atlas; not load-tested |
| Database | 6.5 | Well-modeled & connected, but weak DB credentials |
| Performance | 7.0* | Clean 103 kB shared JS; `<img>` hurts LCP — *not field-measured* |
| Accessibility | 6.5* | Alt text present, no a11y console errors — *not AT-tested* |
| Bulk Upload | N/V* | Code reviewed; *not runtime-verified* |

`*` = partially assessed / not fully verified.

---

## 6. Findings (with evidence)

### 🟠 MEDIUM

#### M-1 — Contact page map is blocked by the site's own CSP
- **Location:** `app/contact/page.jsx` (builds `https://www.google.com/maps?q=…&output=embed` into an `<iframe>`) + `next.config.mjs` CSP.
- **Repro:** Open `/contact` with devtools.
- **Expected:** map renders.
- **Actual:** every visit logs `Framing 'https://www.google.com/' violates the following Content Security Policy directive: "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com"`. The iframe is blocked → blank frame.
- **Root cause:** CSP `frame-src` whitelists only self + Razorpay; the map host is not allowed.
- **Fix:** add `https://www.google.com` to `frame-src`, **or** replace the iframe with a static "Open in Google Maps" link (keeps Google out of the page).
- **Evidence:** Playwright console capture on `/contact` (1 error) + source grep.

### 🟡 LOW

#### L-1 — Contact API leaks parser internals and returns 500 on bad input
- **Location:** `app/api/contact/route.js` (single try/catch that returns `err.message`).
- **Repro:** `POST /api/contact` body `{bad` → **HTTP 500**, response `{"ok":false,"error":"Expected property name or '}' in JSON at position 1 (line 1 column 2)"}`. A ~2 MB body also 500s.
- **Expected:** `400` with a generic message (as `auth/register` and `auth/otp/request` already do).
- **Root cause:** `req.json()` is inside the catch-all; raw error surfaced; no body-size guard.
- **Fix:** parse in its own try/catch → `400`; return a generic error; add a size limit. Audit all 52 routes for the same pattern.

#### L-2 — Homepage has no structured data
- **Location:** root layout / `app/page.jsx`. (Product pages `app/products/[slug]/page.jsx` **do** emit valid `Product` JSON-LD ✓.)
- **Actual:** no `<script type="application/ld+json">` on `/`.
- **Impact:** misses `Organization` + `WebSite` (`SearchAction` sitelinks box) rich results.
- **Fix:** add Organization + WebSite JSON-LD once in the root layout.

#### L-3 — Placeholder / dead links in global chrome
- **Location:** footer app-store / play-store badges → `/shop` (×4); header top-links "Refurbished" and "Become a Partner" → `href="#"` (`lib/site.js`).
- **Impact:** reads as unfinished to a client/first-time visitor.
- **Fix:** point to real destinations or hide until ready.

#### L-4 — `/api/health` reports healthy without checking the database
- **Location:** `app/api/health/route.js` returns static `{ok:true, ts}`.
- **Impact:** a load balancer / uptime monitor sees "healthy" even if Atlas is down — masking the outage that matters most.
- **Fix:** `await dbConnect()` + cheap ping; return `503` on failure.

### ℹ️ INFO / HARDENING

#### I-1 — Weak, embedded database credentials
`MONGODB_URI` uses a trivially weak Atlas credential (username effectively equals
password). `.env.local` **is** gitignored (verified) so it's not in source
control, but the secret is guessable. **Rotate to a strong password + enable
Atlas IP allow-listing / VPC peering** before production.

#### I-2 — `<img>` used site-wide instead of `next/image`
The build emits many `no-img-element` warnings. Deliberate (inherited from the
cloned theme), but it forgoes responsive sizing, lazy-loading, and modern
formats — the biggest LCP/bandwidth lever at scale.

---

## 7. Things Verified as Working (evidence, not assumption)

- **Authorization is airtight at runtime.**
  - Unauthenticated: `/api/seller/*`, `/api/admin/*`, `/api/account/*` all → `401`. IDOR mutation attempts (`POST /api/admin/withdrawals/<id>`, `PATCH /api/admin/sellers/<id>`, `DELETE /api/seller/products/<id>`) → `401`.
  - Authenticated as **seller**: seller APIs `200`; **all** admin APIs `403`; buyer-only account API `403`; `/admin` page redirects away.
  - Authenticated as **admin/superadmin**: admin APIs `200`; buyer-only `403`; another seller's stats `403` (no cross-tenant leak).
- **Payment integrity** (`app/api/payment/verify/route.js`): HMAC signature verification; idempotent order update (`payment: { $ne: "paid" }`); stock decrement inside a Mongo transaction that rolls back on oversell — immune to double-click/retry double-spend.
- **OTP abuse protection:** per-IP limit measured precisely — exactly **15× `200` then `429`**; anti-enumeration confirmed (reset for unknown account returns `200` silently).
- **Injection-safe search:** `searchProducts` escapes all regex metacharacters (`(a+)+$` neutralized); query params are strings so NoSQL operator injection is not possible.
- **Security headers present:** `Content-Security-Policy`, `Strict-Transport-Security` (max-age 63072000), `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. No `X-Powered-By` leak.
- **Error handling:** correct `404` (pages + APIs) and `405` (wrong method); `register`/`otp` handle malformed JSON as `400`/`422`.
- **Frontend robustness:** crawl of 14 public pages (`/`, `/products`, `/about`, `/contact`, `/faq`, `/workshops`, `/become-supplier`, `/export`, `/offers`, `/bestsellers`, `/cart`, `/login`, `/signup`, `/policy/privacy`) → all `200`, **0** console errors (except M-1 on `/contact`), **0** hydration mismatches, **0** page errors, **0** broken images.
- **Clean rebrand:** no leftover "Medikabazaar" brand text in rendered components.
- **Build:** compiles clean (only the deliberate `<img>` lint warnings); 103 kB shared JS; middleware 87.8 kB; ISR on catalog; category counts via Mongo aggregation (no full scans).

---

## 8. Enterprise Recommendations (100k+ products · 10k+ sellers · 1M+ users)

1. **Images:** migrate `<img>` → `next/image` or a Cloudinary loader (creds already present) for responsive/AVIF/lazy delivery. Dominant bandwidth + LCP factor at scale.
2. **Rate limiting is in-memory** — won't share state across instances/serverless. Move to Redis/Upstash so OTP + burst limits hold cluster-wide.
3. **Search:** `$regex` across `$or` fields won't hold at 100k products. Move to Atlas Search (Lucene) or a dedicated engine.
4. **Database:** plan Atlas tier/sharding + read replicas; add compound indexes (`{seller, createdAt}`, buyer order lookups).
5. **Bulk upload:** move parsing/publishing to a queue (BullMQ/SQS) with chunked workers so a 1000-row upload never blocks a request or spikes memory.
6. **Observability:** structured logging + error tracking (Sentry), tracing, and the DB-aware health check are prerequisites.
7. **CDN/edge caching** in front of ISR; separate the image/asset origin.

---

## 9. Recommended Action List

**Before real traffic (launch-gating):**
- [ ] Execute one **live Razorpay** payment end-to-end.
- [ ] Run a **bulk upload** of ~1000 rows + a ZIP of images; watch memory + DB write throughput.
- [ ] Rotate DB credentials + lock down Atlas network access (I-1).

**Quick fixes (small PRs):**
- [ ] M-1 contact map CSP / static link.
- [ ] L-1 contact API error handling (+ sweep all routes).
- [ ] L-2 homepage Organization/WebSite JSON-LD.
- [ ] L-4 DB-aware `/api/health`.
- [ ] L-3 placeholder/dead links.

**Then re-run:** a real accessibility pass (AT + contrast) and a Lighthouse/Web-Vitals measurement on the hosted environment.

---

## 10. Open Questions for the Second Reviewer (ChatGPT)

1. Is 🟡 "Ready With Minor Fixes" the right call, or should the un-verified payment/bulk-upload flows push it to 🟠 until proven?
2. Is the **exact-role `buyer`** policy (sellers/admins blocked from buyer flows) the right product decision, or should staff be able to place test orders?
3. The in-memory rate limiter: acceptable for a single-instance launch, or must it be Redis-backed from day one?
4. Any additional attack surface the methodology missed (e.g., mass-assignment on seller/product CRUD, webhook endpoints, JWT/session-fixation specifics)?
5. Given `<img>` is site-wide and intentional, what's the lowest-effort path to acceptable LCP without a full `next/image` migration?
