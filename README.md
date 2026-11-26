# ABEM RESTAURANT — Flagship Website, CMS & Abem Flow Platform

> Where fire meets heritage — Ethiopia on one table.

The complete, production-ready platform for **Abem Restaurant** (Addis Ababa): a cinematic public website in English + Amharic, a full no-code admin CMS, **Abem Flow** (smart ordering + service management: table-QR, kitchen display, waiter board, rider dispatch, live tracking) and the **Abem Rewards** loyalty engine — all running on Next.js 16 + Neon Postgres, deploy-ready for Vercel.

**Designed & Developed by Joseph James**

---

## 1. Feature map

### Public site (cinematic, mobile-first, EN/አማርኛ)
| Route | What it is |
|---|---|
| `/` | Flagship home: preloader, hero (admin-configurable video + animated ember fallback), signature marquee, parallax story + animated stats, featured-dish carousel, chef spotlight, experience bento, Abem Flow teaser, testimonials, gallery strip, reservation CTA |
| `/menu` | Admin-managed menu: category tabs, sticky rail, search, filters (Fasting/Tsom, Vegan, heat, Chef's picks), dish detail modal, prices in ETB, EN/AM names, JSON-LD Menu schema |
| `/reservations` | Multi-step booking (date → time slots with live availability → area: indoor/garden/VIP → occasion → contact), confirmation reference |
| `/about` | Timeline story, values, chef & team grid, Ethiopian heritage panels, awards, pinned horizontal-scroll culture section |
| `/experience` | Buna ceremony, gursha, azmari nights, monthly specials calendar, parallax venue tour, FAQ |
| `/gallery` | Masonry grid, filters, lightbox (keyboard + swipe), image & video |
| `/events` | Event packages (weddings, corporate, birthdays, VIP Ember Room), capacity table, inquiry form |
| `/contact` | Validated form (honeypot + rate limit), branch switcher, admin-editable Google Maps embeds, Get Directions deep links, geolocation distance helper |
| `/order` | **Abem Flow ordering hub** — delivery / takeaway / dine-in QR, cart, coupons, landmark-friendly addresses, payment adapters (COD live; Telebirr/CBE/Chapa/Santimpay slotted) |
| `/track`, `/track/[code]` | Live order tracking with animated stage tracker, rider + OTP for delivery |
| `/rewards` | Abem Rewards: points, tiers, birthday bonus, referral codes |
| `/stories` | Admin-managed editorial (blog) |
| `/careers` | Openings + application form |
| `/legal` | Privacy & terms |

### Operations (PWA-style boards, session-protected, live via SSE)
| Route | Who | What |
|---|---|---|
| `/staff` | Waiters | Service requests (waiter/bill/water), table status, one-tap order flow, sound cues |
| `/kitchen` | Kitchen | Live tickets (New → Preparing → Ready), timers green→amber→red, station filters, allergy/fasting highlights, one-tap bump |
| `/rider` | Riders | Assigned deliveries, navigation deep links, Picked up → On the way → Delivered with OTP proof |

### Admin CMS — `/admin`
Owner / Manager / Staff roles (JWT cookie sessions, bcrypt hashes, edge middleware).

- **Dashboard**: orders, revenue, top dishes, peak hours, occupancy — charts + KPIs
- **Orders manager**: filters, status flow, rider assignment, payment status, cancel
- **Reservations manager**: confirm / decline / seat, notes, date filter
- **Menu manager**: categories + dishes, prices, tags, spicy level, vegan/fasting/chef-pick/featured toggles, "86'd" availability switch, image upload
- **Content**: hero copy + video/poster URL, stats, announcement banner, SEO per page, team, testimonials, FAQs, event packages, stories, job openings
- **Gallery**: upload + organize images/videos
- **Messages**: contact inbox, newsletter subscribers (CSV export), job applications
- **Tables & QR**: dining table registry + printable QR sheets (`/menu?table=TOKEN`)
- **Settings**: contact info, weekly hours + holidays, branches (with per-branch map embed + directions URLs), feature flags (`ordering_enabled` etc.), loyalty rules, theme color pickers, logo
- **Activity log**: who changed what
- **Backup**: full JSON export

### Global experience systems
Session preloader (SVG logo draw + counter + curtain split), Lenis smooth scroll synced with GSAP ScrollTrigger, custom cursor with magnetic buttons, scroll progress bar, back-to-top with progress ring, hide-on-scroll frosted navbar, full-screen staggered mobile menu, floating mobile action cluster (Call/WhatsApp/Reserve/Order), live "Open now" badge, announcement banner, film grain, ember canvas, branded 404, error boundary, skeletons, reduced-motion fallbacks, `prefers-reduced-motion` respected everywhere.

---

## 2. Tech stack

- **Next.js 16 (App Router) + TypeScript 5** (strict, zero `any`)
- **Tailwind CSS 4** with the "Abem Ember" design-token system (charred espresso `#0B0705`, berbere `#B3261E`, saffron gold `#E8A317`, injera cream `#F4E9D8`, highland green `#2F5D3A`) + refined light variant
- **Framer Motion** (reveals, page transitions) + **GSAP ScrollTrigger** (pinned/parallax scenes) + **Lenis** smooth scroll
- **Prisma ORM → Neon Postgres** (pooled + direct URLs)
- Auth: JWT (jose) httpOnly cookie sessions, bcryptjs, edge middleware
- **SSE** live stream (`/api/live/stream`) with polling fallback for all boards
- Zod validation + React Hook Form on every form; in-memory rate limiting + honeypots on public endpoints
- Adapter pattern for **payments** (COD live; Telebirr / CBE Birr / Chapa / Santimpay documented stubs — never fake success) and **notifications** (console adapter; Africa's Talking/WhatsApp/email templates included)
- i18n: EN/AM dictionary + per-field `nameAm` content columns
- SEO: metadata API, `sitemap.xml`, `robots.txt`, JSON-LD (`Restaurant`, `Menu`), OG/Twitter cards, `humans.txt`
- PWA: manifest + icons + service worker for staff/kitchen/rider

---

## 3. Getting started (local)

```bash
# 1. Install
bun install        # or: npm install

# 2. Environment
cp .env.example .env
#    → fill DATABASE_URL (Neon pooled), DIRECT_URL (Neon direct), SESSION_SECRET

# 3. Database
bunx prisma db push         # creates schema on Neon
bun prisma/seed.ts          # seeds menu (32 dishes EN/AM), content, tables, zones, coupons

# 4. Run
bun run dev                 # http://localhost:3000
bun run lint                # quality gate (0 errors, 0 warnings)
bunx tsc --noEmit           # type gate (clean)
```

### Admin first login
1. Open `/admin/login`
2. Seeded owner: **owner@abemrestaurant.et** / **Abem@2024!**
3. Staff demo account: **staff@abemrestaurant.et** / **Staff@2024!**
4. **Change the password immediately** (add a password-change route or rotate the seed hash — see `prisma/seed.ts`).

> The seed is idempotent — re-running never duplicates.

---

## 4. Deploy on Vercel (step by step)

1. Push this repo to GitHub (`main`).
2. Vercel → **Add New Project** → import the repo.
3. Framework preset: **Next.js** (auto). Build command default (`next build`).
4. Environment variables (Project → Settings → Environment Variables):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Neon **pooled** connection string (`...pooler...neon.tech/neondb?sslmode=require`) |
   | `DIRECT_URL` | Neon **direct** (unpooled) string |
   | `SESSION_SECRET` | 64-char random hex (`openssl rand -hex 32`) |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-production-domain` |
   | `CONTACT_INBOX` | inbox for contact-form notifications (optional) |

5. Deploy. Then run the schema push once against production from your machine:
   ```bash
   DATABASE_URL="<pooled>" DIRECT_URL="<direct>" bunx prisma db push
   bun prisma/seed.ts
   ```
6. Add your custom domain in Vercel → Settings → Domains.

> **Media uploads**: `/api/admin/upload` writes to `public/uploads`, which is ephemeral on Vercel serverless. For production-grade media, point uploads at Vercel Blob / Supabase Storage / Cloudinary — the image-picker already accepts pasted URLs, so any CDN URL works with zero code changes.

> **Realtime**: `/api/live/stream` (SSE) streams every 2.5 s; all boards fall back to snapshot polling automatically. For multi-region scale, swap the snapshot source for Supabase Realtime — the board hooks (`src/hooks/useLive.ts`) are the only touchpoint.

---

## 5. The "showcase → full ordering" switch

The public site works as a pure showcase when ordering is off:
**/admin → Settings → Features → toggle "Ordering"** (also Delivery, Table QR, Rewards, Pre-orders).
- Off: `/order` renders an elegant "ordering opens soon" showcase; the navbar hides the Order CTA; reservations/contact still work.
- On: the full Abem Flow stack lights up — no rebuild, no redeploy.

---

## 6. Plugging in payments (adapter pattern)

`src/lib/payments.ts` — implement `initiate()` + `verify()` for a provider, add its env keys to `.env.example`, register it in `PAYMENT_ADAPTERS`. Orders stay `UNPAID` until the provider's webhook confirms. Stubs with reference shapes are included for **Telebirr**, **CBE Birr**, **Chapa** and **Santimpay**. Cash on delivery ships active.

## 7. Plugging in notifications

`src/lib/notifications.ts` — the console adapter is default. Uncomment/implement `AfricaTalkingAdapter` (SMS, Ethiopia-ready), a WhatsApp Cloud API adapter, or Resend for email — same `send()` contract. Reservation/order confirmations already call `notify()`.

---

## 8. Project structure

```
src/
  app/                    # routes: public pages, ops boards, admin, api/**
  components/
    brand/                # Logo, EmberCanvas, Preloader
    experience/           # Navbar, Footer, Cursor, SmoothScroll, BackToTop...
    shared/               # Reveal, SectionHeading, Marquee, Counter, PageHero...
    sections/             # page sections (home, about, experience, gallery, events, contact)
    menu/ reservations/   # feature UIs
    order/ ops/           # Abem Flow UIs
    admin/                # CMS UI
  hooks/                  # useCart, useLive
  lib/                    # db, settings, auth, live (SSE), payments, notifications,
                          # rate-limit, validation (zod), i18n, format, log
prisma/                   # schema.prisma (Neon Postgres) + seed.ts
public/                   # brand/, images/, uploads/, sw.js, humans.txt
```

## 9. Content model

Everything visible is editable with no code: menu, hero, pages, gallery, team, testimonials, events, stories, FAQs, contact info, hours + holidays, branches & map embeds, socials, banners, SEO, theme colors, logo, feature flags, loyalty rules — via `/admin`. Amharic fields (`*Am`) sit beside every English string.

## 10. Credits

- Concept, design system ("Abem Ember"), engineering — **Joseph James**
- Photography — AI-generated brand imagery (replaceable from the admin Media picker)
- Built with Next.js, Tailwind CSS, shadcn/ui, Framer Motion, GSAP, Lenis, Prisma, Neon

© Abem Restaurant. Designed & Developed by Joseph James.
