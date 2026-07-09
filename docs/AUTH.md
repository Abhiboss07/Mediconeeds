# Authentication & Authorization — Next-Phase Plan

The seller portal frontend is complete and **auth-ready**. Today it runs open (no
backend); this document is the blueprint for turning on secure, role-based access.

## Roles
`guest → buyer → seller → admin → superadmin` (see `lib/auth.js#ROLE_RANK`).

| Role | Can do |
|------|--------|
| **guest** | Browse storefront, view Become-a-Seller, submit an application |
| **buyer** | Everything guest + cart, checkout, `/account/*` |
| **seller** | `/seller/*` — dashboard, products, orders, inventory, wallet, analytics, support |
| **admin** | `/admin/*` — approve/reject sellers & products, manage catalogue/commission |
| **superadmin** | Everything admin + admin management, platform config |

## Route guards
`lib/auth.js` already declares the access map (`ROUTE_GUARDS`) and helpers
(`requiredRole`, `canAccess`). These are the single source of truth.

## What the auth phase adds
1. **Session provider** — replace `getCurrentRole()` with a real read (NextAuth /
   Clerk / custom JWT in an httpOnly cookie).
2. **`middleware.ts`** — call `canAccess(role, pathname)`; redirect unauthorised
   users to `/login?next=…` (or `/seller/register` for would-be sellers).
3. **Server components / route handlers** — re-check role server-side (never trust
   the client). Add `assertRole()` to each `/api/*` handler.
4. **Login / signup / OTP** — wire the existing `/login`, `/signup`, `/otp`,
   `/forgot-password`, `/reset-password` pages to the auth backend.
5. **Seller approval gate** — a `seller` with `status !== "approved"` sees the
   application-status screen instead of the dashboard.
6. **Document verification** — admin reviews uploaded GST/PAN/cheque/licence before
   flipping `SellerStatus` to `approved`.

## Backend seam already in place
- `lib/seller/api.js` — every mutation is one function; swap mock bodies for `fetch`.
- `lib/seller/store.js` — swap the seed source for API reads; entity shapes
  (`lib/seller/models.js`) are the DB schema, so nothing else changes.
- `/api/seller-application` — real route handler already accepts onboarding submits.

## Suggested data integration order
Sellers → Documents/Approval → Products → Inventory → Orders → Settlements →
Analytics → Notifications → Support.
