# Implementation Progress

## Phase 0 — Audit

- [x] Inspected package.json, lockfile, README, schema, routes, components and env config.
- [x] Verified the baseline did not build (type errors, stale Prisma client).
- [x] Authored `docs/PROJECT_AUDIT.md` and `docs/IMPLEMENTATION_PLAN.md`.
- [x] Replaced the broken business-logic layer; preserved the visual language and stack.

Files: `docs/PROJECT_AUDIT.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/PROGRESS.md`.

## Phase 1 — Database & domain architecture

- [x] Full domain model in `prisma/schema.prisma`: identity (User, Address, Role, Permission, UserRole, Session, OtpChallenge), catalog (Category, Brand, Product, ProductImage, ProductVariant, SizeGuide), shopping (Cart, CartItem, WishlistItem), orders (Order, OrderItem, Payment, Shipment, OrderStatusHistory), inventory (InventoryMovement), promotions (Coupon, CouponUsage), CX (Review, ReturnRequest), audit (AuditLog), config (SiteSetting).
- [x] Money as `Decimal(12,2)` Toman; signed inventory deltas; immutable order snapshots; soft deletion; indexes and unique SKUs.
- [x] Initial migration generated without a live DB and committed under `prisma/migrations/`.
- [x] Seed rewritten (`prisma/seed.ts`) with roles/permissions and development catalog.
- [x] `docs/DATABASE_MIGRATION.md` documents fresh installs and legacy `db push` upgrades.

Verified: `npx prisma generate` succeeds. Remaining limitation: migrations were not executed against a real MySQL server in this environment.

## Phase 2 — Authentication & authorization

- [x] OTP login (bcrypt-hashed codes, 10-min TTL, attempt caps, resend cooldown, per-phone/IP rate limits).
- [x] Signed JWT + DB session with hashed token, rotation and revocation; `HttpOnly`/`Secure`/`SameSite` cookie.
- [x] RBAC matrix (`src/lib/permissions.ts`) provisioned idempotently; API `requirePermission`, page `requirePageAdmin`.
- [x] Suspended accounts cannot log in or reactivate themselves; role changes restricted to `SUPER_ADMIN`.
- [x] Dev OTP endpoint returns 404 in production; no public admin registration (`npm run admin:grant`).

Files: `src/lib/auth/*`, `src/app/api/auth/*`, `scripts/bootstrap-admin.ts`.

## Phase 3 — Product catalog

- [x] Products, variants, images, categories, brands, size guides; soft delete; inventory movements.
- [x] Public APIs and admin CRUD APIs with validation and permissions.
- [x] Search/filter/sort/pagination with Persian search normalization.

## Phase 4 — Storefront

- [x] Home, shop, category, search, product detail (gallery, variant picker, reviews, related).
- [x] About, contact, size guide, shipping/returns policies, privacy, terms.
- [x] RTL, Toman currency, Jalali dates, Persian digits, responsive design system.

## Phase 5 — Shopping cart

- [x] Guest cart via opaque `HttpOnly` cookie; merge on login.
- [x] Quantity update/remove; server-side stock checks.

## Phase 6 — Checkout & order management

- [x] Server-authoritative totals (recomputed), coupon validation, shipping rules.
- [x] Saved or new address; idempotency key; stock reservation with conditional updates.
- [x] Payment abstraction: Zarinpal + dev mock; callback finalization is idempotent.
- [x] Gateway-initiation failure now cancels the order and restores stock.
- [x] Order tracking by number + phone; status history; COD support.

## Phase 7 — Customer account

- [x] Profile, addresses, orders + detail, wishlist, reviews, return requests.
- [x] Ownership checks on every account query and mutation.

## Phase 8 — Admin dashboard

- [x] Overview (KPIs, 14-day sales chart, low stock, recent orders).
- [x] Products (create/edit, variants, images upload/URL, inventory history).
- [x] Categories, brands, coupons, inventory adjustments.
- [x] Orders list + detail with validated status transitions and tracking numbers.
- [x] Customers (role/active), returns processing, review moderation.
- [x] Site settings editor (brand, theme tokens, contact, shipping, features, content).
- [x] Audit log viewer.

## Phase 8.1 — Control Center extension (see docs/ADMIN_PROGRESS.md)

- [x] Persistent/collapsible RTL admin shell, global search, notifications,
  breadcrumbs, quick actions, date ranges, dark theme, skeletons/errors.
- [x] Real dashboard metrics + charts with documented revenue/net/refund formulas.
- [x] CMS: homepage builder, pages, banners, menus, media library, blog, footer.
- [x] Product bulk price/stock/status/feature/archive, duplication, low-stock alerts.
- [x] CRM profile + seven segments + filtered CSV export.
- [x] First-party analytics ingestion, dedup, bot filter, consent, aggregates,
  traffic/product/funnel/search/campaign/customer dashboards and session explorer.
- [x] Marketing campaigns, subscribers, abandoned carts, consent-aware adapters,
  token unsubscribe.
- [x] Reports center with 10 report types, comparison, grouping, print/CSV.
- [x] Encrypted integration secrets with masked UI; system health and maintenance job.
- [x] Eight built-in RBAC roles, custom roles/permission editor, role guards,
  session revocation, audit before/after + request id.

## Phase 9 — Iranian e-commerce requirements

- [x] Toman currency, Persian/Indic digit normalization, Iranian phone + postal validation.
- [x] Jalali date formatting (Asia/Tehran), RTL layouts.
- [x] Configurable shipping methods and free threshold; COD; Zarinpal adapter.

## Phase 10 — Security hardening

- [x] CSRF same-origin checks, Zod validation, 64 KB body cap.
- [x] Upload magic-byte checks, size/dimension limits, re-encode to WebP.
- [x] Security headers + CSP (middleware), HSTS in production.
- [x] Bounded in-memory rate limiter; audit trail.
- [x] `docs/SECURITY_AUDIT.md` documents controls and accepted dependency risks.

## Phase 11 — SEO & performance

- [x] `robots.ts`, dynamic `sitemap.ts` (products/categories), canonical URLs.
- [x] Product JSON-LD (Product + Offer + AggregateRating), BreadcrumbList, site WebSite/Organization.
- [x] Open Graph/Twitter metadata; noindex on account/admin/auth/cart/checkout.

## Phase 12 — Testing

- [x] Unit tests (Node test runner + tsx): money/coupons/shipping, Persian helpers, Zod schemas, RBAC matrix, Tehran date ranges, analytics schema, CSV escaping. **47/47 passing.**
- [ ] Integration tests against MySQL in CI (manual live smoke tests were run; no disposable DB suite yet).
- [ ] Browser E2E for OTP login → cart → checkout → callback (manual flow verified previously).

## Phase 13 — Production readiness

- [x] `npm run type-check` passes.
- [x] `npm run build` completes and `npm run start` serves the app.
- [x] `docs/DEPLOYMENT.md` and `docs/SECURITY_AUDIT.md` written.
- [x] `.env.example` documents required configuration.
- [ ] Apply migrations and run the app against a real MySQL instance (operator step).
- [ ] Configure production SMS + Zarinpal credentials and verify a live payment.
- [ ] Schedule a Next.js 16 / zod 4 upgrade to clear remaining audit advisories.

## Verification log (latest)

| Command | Result |
| --- | --- |
| `npm run type-check` | passes (strict, no errors) |
| `npm test` | 47/47 passing |
| `npm run build` | succeeds, all routes compiled |
| Control Center smoke | all `/admin/*` pages (SUPER_ADMIN) → 200; CMS/roles/bulk/marketing/secrets/export/maintenance APIs verified against live MySQL |
| `npm run start` smoke test | `/`, `/shop`, `/product/*`, `/sitemap.xml`, `/robots.txt`, `/api/products` → 200; `/admin` → 307 |
| `npm run db:seed` | runs and is idempotent (6 products / 36 variants / 5 categories) |
| Full E2E (dev) | OTP login → cart → checkout → idempotent replay → mock payment → order `PAID` + stock decrement; unauthenticated admin write blocked |
| `npx prisma generate` | succeeds |
| `npm audit --omit=dev` | 5 advisories; tracked in `docs/SECURITY_AUDIT.md` |

Notes:
- Content/policy pages and the sitemap are `force-dynamic` so admin settings and
  catalog changes appear without a rebuild.
- Tailwind colors use RGB channel variables so `/opacity` modifiers and
  admin-edited theme colors both work.
- Legacy root-level markdown docs were removed; `README.md` and `docs/` are the
  authoritative documentation set.
- The initial migration file was stored as UTF-16 and made `prisma migrate deploy`
  fail with P3015; it is now UTF-8 and applied successfully to MySQL. The
  migration checksum matches `_prisma_migrations`.
- Seed/bootstrap scripts load `.env` via `dotenv`; empty optional env values are
  treated as unset.
- The dev OTP store lives on `globalThis` because Next.js bundles each route
  separately.
- Fixed a Next.js dynamic segment conflict (`[id]` vs `[productId]`) that caused
  a 500 response on every route at runtime.
- Removed `output: "standalone"` so `npm start` works; standalone deployment is
  documented as an optional production setup.
