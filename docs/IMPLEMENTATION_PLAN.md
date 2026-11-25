# ILKAII — Implementation Plan (Phase 0 → 13)

## Legend
P0 = blocking, P1 = MVP must-have, P2 = should-have. Every task ends with `npm run type-check` and `npm run build` verification.

| # | Phase | Task | Pri | Depends on | Acceptance criteria |
|---|---|---|---|---|---|
| 1 | 0 | Audit repository + schemas + routes + security | P0 | — | `docs/PROJECT_AUDIT.md` written with evidence |
| 2 | 0 | Implementation plan + progress ledger | P0 | 1 | This file + `docs/PROGRESS.md` |
| 3 | 1 | Rewrite Prisma schema (identity/catalog/shopping/orders/inventory/promotions/CX/audit/settings) | P0 | 1 | `npx prisma generate` succeeds; money Decimal; FKs/indexes/unique constraints |
| 4 | 1 | Generate initial migration + legacy data upgrade guide | P0 | 3 | SQL migration produced by `prisma migrate diff`; no `db:push` in prod path |
| 5 | 1 | Replace seed with safe dev-only catalog + role/permission bootstrap | P1 | 3 | Seed creates categories, variants, demo products, roles, permissions; no admin credentials hardcoded |
| 6 | 2 | Auth: Iranian phone normalization, OTP hashing/expiry/attempts/cooldown/rate limit | P0 | 3 | Zod validated; generic responses; no OTP in responses/logs |
| 7 | 2 | Sessions: signed JWT + DB session hash, HttpOnly/Secure/SameSite cookies, rotation, revocation, logout | P0 | 6 | `/api/auth/session` reflects DB state; revoked token rejected |
| 8 | 2 | RBAC (5 roles + permissions) and server-side guards + admin bootstrap CLI | P0 | 3,7 | No header-based trust; unauthorized admin mutation rejected server-side |
| 9 | 3 | Catalog domain service (CRUD, filters, sort, search, pagination, related/new/featured/best sellers) | P1 | 3 | DB-backed list/detail; only ACTIVE non-deleted products public |
| 10 | 3 | Upload service (magic bytes, size, re-encode, safe names, storage adapter) | P1 | 8 | Rejects SVG/HTML/oversized files; admin-only |
| 11 | 4–5 | Themeable design system + base UI components + RTL/Persian foundation | P1 | — | Tokens from config; all interactive elements ≥44px with focus states |
| 12 | 4 | Storefront pages (home, shop, category, product, search, content pages) | P1 | 9,11 | No mock data; SEO metadata; responsive; skeletons/empty states |
| 13 | 5 | Server-authoritative cart (guest cookie + user cart, merge on login) | P0 | 3,7 | Backend recomputes all prices; invalid/unavailable variants rejected |
| 14 | 6 | Checkout: address, shipping, coupon, inventory + order transaction, payment abstraction | P0 | 13 | Idempotent order creation; no duplicate stock deduction |
| 15 | 6 | Payment adapters (mock dev-only + configurable Zarinpal) with idempotent callback | P0 | 14 | Replayed callback is a no-op; production refuses mock |
| 16 | 7 | Customer account: profile, addresses, orders, tracking, wishlist, reviews, returns | P1 | 7,14 | Ownership enforced in every query |
| 17 | 8 | Admin dashboard: overview, products, variants/inventory, orders, customers, coupons, settings, audit | P1 | 8,9,14 | Real stats; all mutations authorized + audited |
| 18 | 9 | Persian/RTL: Jalali dates, digits, postal code, search normalization, configurable shipping | P1 | 11 | All currency output Toman; times Asia/Tehran |
| 19 | 10 | Security hardening: headers, origin check, validation, rate limits, audit, npm audit | P0 | 7,8,14 | `docs/SECURITY_AUDIT.md` with implemented/remaining controls |
| 20 | 11 | SEO: metadata, canonical, sitemap, robots, JSON-LD, image optimization | P2 | 12 | Product pages indexable; no caching of private data |
| 21 | 12 | Tests: unit (money/discount/phone/postal/state), integration (auth/cart/checkout/idempotency with mocked DB), security | P1 | 14 | `npm test` passes |
| 22 | 13 | Docs: `.env.example`, migrations, deployment, backup, production config | P1 | all | `docs/DEPLOYMENT.md`; build & type-check pass |

## Explicitly out of MVP scope
AI recommendations, loyalty, wallet, affiliate, advanced analytics, marketing automation, multi-vendor, ERP integrations.

## Environment limitations / blockers
- No MySQL server is reachable in this environment; database integration/E2E tests require the operator to supply `DATABASE_URL`. Pure unit tests and mocked-service integration tests run locally.
- No SMS/payment production credentials; development adapters are used and are blocked in production.
