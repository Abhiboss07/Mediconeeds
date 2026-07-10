# Mediconeeds — Production Deployment Guide (Phase 4A)

A single **Next.js 15 App-Router** application (SSR + API routes + edge middleware
in one Node process) backed by **MongoDB**. It cannot be split into a separate
"frontend" and "backend" — they are the same server.

> ⚠️ **Architecture note (Hostinger + Render target).** Because this is a unified
> Next.js server (pages query MongoDB via server components; API routes and
> Auth.js live in the same process), you **cannot** put a static "frontend" on
> Hostinger and a separate "backend" on Render. Deploy the **whole app to ONE
> Node host**. Two clean options:
>
> **Option A — Render (recommended, matches your stack):** deploy the entire app
> as a Render **web service** (`render.yaml` included). Use **Hostinger for the
> domain/DNS** → CNAME to the Render URL. Render gives you build/deploy, TLS,
> health checks and autoscale with zero server admin.
>
> **Option B — Hostinger VPS:** run the whole app on a Hostinger **VPS** (KVM)
> with PM2 + Nginx (Section 1 below). Requires OS/SSL management; Hostinger
> *shared* hosting cannot run Next.

---

## 0. Render deployment (Option A — recommended)

1. Push the repo to GitHub → Render **New → Blueprint** → pick the repo (`render.yaml` auto-detected).
2. Set the `sync:false` secrets in the Render dashboard: `MONGODB_URI` (…/Mediconeeds),
   `AUTH_SECRET`, `AUTH_URL` (your final HTTPS domain), `RAZORPAY_*`, `SMTP_*`,
   `ADMIN_*`, `GOOGLE_*`. `NODE_ENV=production` and `DEMO_MODE=false` are preset.
3. Build `npm ci && npm run build`; start `npm start` (Next binds Render's `$PORT`).
   Health check: **`/api/health`**.
4. **Atlas:** allowlist Render's outbound IPs (or `0.0.0.0/0` on M10+ with strong auth).
5. **Domain:** add your custom domain in Render → in **Hostinger DNS** add the
   CNAME Render shows. TLS is issued automatically.
6. **Admin seed** (one-time, from your machine against prod):
   `node --env-file=.env.production.local scripts/create-admin.mjs`.

Everything below (Atlas, env, backups, monitoring) applies to both options.

---

## 1. Alternative architecture — Hostinger VPS (Option B)

```
        Internet
           │
     ┌─────▼─────┐   DNS + CDN + TLS + WAF (free tier)
     │ Cloudflare │
     └─────┬─────┘
           │  HTTPS
     ┌─────▼──────────────────────────────┐
     │ Hostinger VPS (KVM 2+, Ubuntu)      │
     │  ┌────────┐   ┌──────────────────┐  │
     │  │ Nginx  │──▶│ PM2 → Next.js :3000│ │
     │  │ (443)  │   │ PM2 → email-worker │ │
     │  └────────┘   └──────────────────┘  │
     └───────────────────┬─────────────────┘
                         │  TLS (SRV, IP allowlist)
                  ┌──────▼───────┐
                  │ MongoDB Atlas │  (M10+ prod / M2 to start)
                  └──────────────┘
```

## 2. Where each component goes

| Component | Host | Why | Trade-offs |
|---|---|---|---|
| **Frontend + Backend** (one Next.js server) | **Hostinger VPS** (KVM 2 / 2 vCPU / 8 GB) with Node 20+, PM2, Nginx | Uses hosting you own; full Node runtime; SSR + API + middleware run together | You manage the OS/patching/SSL. **Hostinger *shared*/Business hosting will NOT work** — it can't run a persistent Node server. A VPS is required. |
| **Database** | **MongoDB Atlas** (owned) | Managed, backups, replica set → **transactions work** (the checkout uses them) | Keep it off the VPS; allowlist the VPS IP. Add the DB name to the URI (`…/mediconeeds`). |
| **Static assets** (`/public`, `/_next/static`) | Served by Next, **cached at Cloudflare** | Zero extra infra; CDN edge-caches immutable `_next/static` | For heavy product media later, move to **S3 + CDN** (`STORAGE_DRIVER=s3` is already scaffolded). |
| **SMTP / email** | **Dedicated provider** (Brevo / Amazon SES / Resend / Hostinger Email) | Deliverability + volume. **Gmail SMTP is not production-grade** (rate-limited, flags automation) | Requires setting `SMTP_HOST` (currently empty — a launch blocker) + SPF/DKIM DNS. |
| **Background worker** (email outbox) | **Second PM2 process** on the same VPS | Processes the outbox on an interval; simple, colocated | Single point of failure with the web app; fine at this scale. |

**Best-fit alternative (not owned):** Vercel is the zero-config ideal for Next.js
(auto SSL/CDN/scaling, native standalone). If you're open to it, Vercel (web) +
Atlas (db) + SES (email) is the lowest-ops option. The guide below uses your
**Hostinger VPS** since that's what you own.

---

## 3. Deployment checklist

### A. MongoDB Atlas
- [ ] Create a project + cluster (**M2/M10**; prod should be M10 for a real replica set & backups).
- [ ] DB user with least privilege (readWrite on `mediconeeds` only).
- [ ] **Network access:** allowlist the Hostinger VPS public IP (avoid `0.0.0.0/0`).
- [ ] Connection string **must include the DB name**: `mongodb+srv://USER:PASS@cluster.xxx.mongodb.net/mediconeeds?retryWrites=true&w=majority`.
- [ ] Enable **Cloud Backups** (continuous / daily snapshots).
- [ ] Seed the admin: `node --env-file=.env.production.local scripts/create-admin.mjs`.

### B. Hostinger VPS
- [ ] Ubuntu 22.04, Node 20 LTS (`nvm install 20`), `npm i -g pm2`.
- [ ] Create a deploy user (non-root), firewall (ufw) allow 22/80/443 only.
- [ ] Clone repo → `npm ci` → create `.env.production.local` (see below) → `npm run build`.
- [ ] `pm2 start ecosystem.config.cjs --env production && pm2 save && pm2 startup`.

### C. Environment variables (`.env.production.local` on the server — gitignored)
Fill every key in **`.env.example`**. Launch-critical:
- [ ] `MONGODB_URI` (Atlas, **with `/mediconeeds`**)
- [ ] `AUTH_SECRET` (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
- [ ] `AUTH_URL=https://yourdomain.com`
- [ ] `DEMO_MODE=false` ← **must be false in prod** (enables real auth/RBAC)
- [ ] `SMTP_HOST/PORT/USER/PASS/FROM/SECURE` (provider creds)
- [ ] `RAZORPAY_KEY_ID/SECRET` (**live** keys for real payments)
- [ ] `GOOGLE_CLIENT_ID/SECRET` (optional — button hides when blank)
- [ ] `ADMIN_EMAIL/ADMIN_PASSWORD` (first admin bootstrap)

### D. Nginx reverse proxy + SSL
- [ ] Nginx `server` block: `proxy_pass http://127.0.0.1:3000;` with `proxy_set_header Host/X-Forwarded-*`.
- [ ] `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com` (Let's Encrypt auto-renew).
- [ ] Or terminate TLS at **Cloudflare** (Full-Strict) + origin cert.
- [ ] Force HTTPS redirect; HSTS is already emitted by the app.

### E. Domain
- [ ] Point domain nameservers to **Cloudflare**; `A` record → VPS IP (proxied).
- [ ] Set `AUTH_URL` + Google OAuth redirect URIs to the final HTTPS domain.

### F. Backups / Logs / Monitoring
- [ ] **Backups:** Atlas snapshots (DB) + nightly `tar` of `/public` uploads if any.
- [ ] **Logs:** PM2 logs (`logs/pm2-*.log`) + `pm2 install pm2-logrotate`. Nginx access/error logs.
- [ ] **Monitoring:** `pm2 monit` + Uptime (UptimeRobot free) hitting `/`. Atlas alerts on connections/disk.
- [ ] **Email worker:** confirm the outbox drains (`pm2 logs email-worker`).

---

## 4. Build & run commands

```bash
npm ci
npm run build                       # produces .next + .next/standalone
pm2 start ecosystem.config.cjs --env production
pm2 logs mediconeeds-web            # verify "Ready"
```

Standalone alternative (lighter): `node .next/standalone/server.js` (copy
`.next/static` and `public/` next to it — Next documents the layout).

---

## 5. Dev / prod configuration separation
- **Dev:** `.env.local` (loaded in dev; `DEMO_MODE=true` OK for local demo).
- **Prod:** `.env.production.local` on the server (gitignored; `DEMO_MODE=false`).
- `.env.example` is the committed template (no secrets). `.gitignore` already
  ignores `.env*` except `.env.example`.
