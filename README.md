# ilkaii

White-label Persian fashion e-commerce platform — Next.js 15 App Router, Prisma +
MySQL, Tailwind, Zod. Persian-first RTL, Toman pricing, Jalali dates and Iranian
phone/postal validation.

## Stack

- **Next.js 15** (App Router, Server Components, route handlers)
- **Prisma 5 + MySQL 8** (migrations committed, `utf8mb4`)
- **Tailwind CSS 3** with runtime theme tokens (no rebuild to rebrand)
- **Zod** validation on every API boundary
- **JWT + DB session** (HttpOnly cookie, rotate/revoke, RBAC matrix)

## Features

- Storefront: home, shop, search, category, product detail, cart, checkout,
  order tracking, content/policy pages
- Customer account: profile, addresses, orders, wishlist, reviews, returns
- Admin dashboard: overview, products/variants/images, categories, brands,
  inventory ledger, orders + status transitions, customers, coupons, returns,
  review moderation, site settings, audit log
- Control Center: CMS (homepage builder/pages/banners/menus/media/blog), CRM
  segmentation, first-party analytics + funnel/session explorer, marketing
  campaigns/subscribers, reports/CSV, encrypted integrations, system health and
  granular RBAC with custom roles
- Server-authoritative checkout, idempotency keys, stock reservation and
  compensation on payment failure
- Configurable SMS/payment/storage adapters; dev-only mock adapters are blocked
  in production
- SEO: dynamic sitemap, robots, canonical URLs, Product/Organization/Breadcrumb
  JSON-LD

## Requirements

- Node.js 20.6+ (Node 22 recommended)
- MySQL 8.0+

## Quick start

```bash
cp .env.example .env          # set DATABASE_URL + SESSION_SECRET
npm install
npx prisma migrate deploy     # apply prisma/migrations
npm run db:seed               # development demo catalog (dev only)
npm run dev                   # http://localhost:3000
```

Create the first administrator after logging in once with the dev OTP:

```bash
ADMIN_PHONE=09123456789 BOOTSTRAP_CONFIRM=yes npm run admin:grant
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run type-check` | Strict TypeScript check |
| `npm test` | Unit tests (Node test runner + tsx) |
| `npm run db:migrate` | Create/apply dev migrations |
| `npm run db:migrate:prod` | `prisma migrate deploy` |
| `npm run db:seed` | Development seed (idempotent) |
| `npm run admin:grant` | Grant an admin role (explicit confirmation) |

## Project structure

```
src/app/(store)     Storefront routes (RTL layout)
src/app/admin       Admin dashboard (RBAC-guarded)
src/app/api         Route handlers (Zod + same-origin + permissions)
src/components      Reusable design system + feature components
src/services        Domain services (catalog, cart, checkout, payment...)
src/lib             Env, auth, money, Persian helpers, validation, RBAC
prisma              Schema, migrations, seed
scripts             Secure admin bootstrap
docs                Authoritative project documentation
```

## Docs

- `docs/PROGRESS.md` — phase-by-phase status and verification log
- `docs/ADMIN_DASHBOARD_PLAN.md` — Control Center architecture, routes and metrics
- `docs/ANALYTICS_ARCHITECTURE.md` — event model, privacy, funnels and formulas
- `docs/ADMIN_SECURITY.md` — RBAC, secrets, audit and admin controls
- `docs/ADMIN_PROGRESS.md` — Control Center checklist and remaining work
- `docs/DEPLOYMENT.md` — production setup, env vars, operations
- `docs/SECURITY_AUDIT.md` — controls, residual risks and mitigations
- `docs/DATABASE_MIGRATION.md` — fresh installs and legacy upgrades
- `prompt.md` — original product specification

## White-label configuration

Brand name, tagline, colors, contact info, shipping prices, feature flags and
page content are edited in **Admin → Settings** and stored in `SiteSetting`.
Theme colors are emitted as CSS variables (`--color-*-rgb`), so changes apply
without rebuilding. Defaults live in `src/config/site.ts` and
`src/config/theme.ts`.
