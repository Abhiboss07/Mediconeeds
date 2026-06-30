# Mediconeeds — Phase 1 (UI Clone of Medikabazaar homepage)

A pixel-faithful clone of the Medikabazaar homepage, rebranded to **Mediconeeds**.
UI only — no auth, backend, Shopify, seller/buyer flows (those are Phase 2).

## Run

```bash
cd mediconeeds-web
npm install
npm run dev      # http://localhost:3000   (or: npm run build && npm run start)
```

## How fidelity is achieved

The reference is a Next.js + styled-components + Tailwind app. To match it
byte-for-byte rather than by eye:

- The **original compiled CSS** (Tailwind base + utilities + Swiper) is reused
  verbatim from the saved page — `app/styles/*.css`, loaded in the original order.
- The **exact original DOM** for each section is preserved and rendered as raw
  HTML inside React section components (`components/Frag.jsx`), so every Tailwind
  arbitrary value and class is identical.
- The styled-components rules (`.bGeMFl`, section titles, prices, badges, …) were
  injected at runtime on the live site and were **absent** from the saved files.
  They were recovered by rendering the live site headless and reading the
  computed styles of each variant → `app/styles/_recovered.css`.
- **Manrope** web fonts are self-hosted (`public/fonts/`); the CSS font URLs were
  rewritten to point at them.
- Carousels (Swiper), the All-Categories mega menu, and a mobile-friendly header
  are wired client-side in `components/Interactions.jsx` and `components/MegaMenu.jsx`.

## Folder structure

```
mediconeeds-web/
├─ app/
│  ├─ layout.jsx            # imports CSS in original order + recovered + responsive
│  ├─ page.jsx              # composes header, banner, sidebar, sections, footer
│  ├─ globals.css           # minimal resets + Manrope wrapper
│  ├─ responsive.css        # graceful mobile/tablet degradation
│  └─ styles/               # original compiled CSS (reused) + _recovered.css
├─ components/
│  ├─ Frag.jsx              # renders a section's exact root element + inner HTML
│  ├─ Interactions.jsx      # Swiper carousels (banner, product rows, refurb, testimonials)
│  ├─ MegaMenu.jsx          # All-Categories dropdown
│  ├─ sections/             # desktop per-section HTML fragments + manifest.json
│  └─ mobile/               # mobile per-section HTML fragments + manifest.json
├─ lib/fragments.js         # reads fragments at render (server)
└─ public/
   ├─ assets/               # all images (local + product images fetched by alt)
   ├─ fonts/                # self-hosted Manrope woff2
   └─ static/images/        # CSS background images
```

## Completed pages

- **Homepage** (the page that was saved locally). Sections: Header, top Banner
  carousel, EXPLORE sidebar, Shop by Category, Top Brands, 6 product carousels,
  trust strip, promo banner, Refurbished, Testimonials, Footer.

## Components created

`Frag`, `Interactions`, `MegaMenu`, and 16 section fragments
(header, banner, sidebar, shop-by-category, top-brands, 6 product rows,
trust-strip, promo, refurbished, testimonials, footer).

## Assets

- **Reused from the local download:** all category icons, brand logos, banner
  images, the first-row product images, footer icons, app-store badges.
- **Downloaded:** 6 Manrope woff2 fonts, 4 CSS background images, and ~47 product
  images (the lower carousels were lazy-load placeholders in the snapshot, so
  their real images were fetched from the live CDN by matching `alt` text).

## Responsive status

Two faithful DOM trees are rendered and toggled purely by CSS breakpoint
(`app/page.jsx`): the **desktop tree** shows at `>=1024px`, the **mobile tree**
at `<1024px`. Each was captured and rebuilt from the live site at its own
viewport, so both match the reference.

- **Desktop / laptop (≥1024px):** pixel-faithful. ✅
- **Tablet / mobile (<1024px):** the real Medikabazaar mobile UI — compact 2-row
  mobile header, full-width search, 3-col category grid with "Show More
  Categories", horizontal product carousels, EXPLORE grid block, and the fixed
  bottom tab bar (Home / Search / Categories / Offer Zone / Profile). ✅
- Mobile fragments live in `components/mobile/`; mobile styled-component variants
  were recovered into `app/styles/_recovered.css`.

## Known gaps (target: 0)

1. **Mobile banner shows its primary slide.** The live mobile banner rotates
   several campaign images; only the first had loaded (the rest were lazy
   placeholders at capture). The primary IMDFLO banner displays correctly; extra
   rotating mobile banner artwork would need to be fetched to restore the loop.
2. **Logos are text wordmarks.** The header/footer Medikabazaar logos are images;
   they're replaced with styled "Mediconeeds" wordmarks pending a real brand logo.
3. **Mega menu is reconstructed.** Its panel is rendered client-side on the live
   site and wasn't in the saved DOM, so it's rebuilt from the known category list.
4. **A few product images are stand-ins.** ~25 products in the saved carousels are
   no longer on the live site, so plausible medical-product images were
   substituted. All product *data* (titles, prices, offers, ratings) is exact.
   (Phase 2 replaces all product content anyway.)
