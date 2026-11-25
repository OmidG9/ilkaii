# ILKAII — Repository Audit (Phase 0)

Date: 2026-11-25
Scope: complete inspection of `package.json`, `prisma/schema.prisma`, all 42 API routes, all server actions, auth/middleware, libraries, stores, hooks, storefront and admin pages, configuration and scripts.

## 1. Existing architecture

- Next.js 15.5.18 App Router, React 18.3.1 (README claims React 19), TypeScript 5.9.3 in strict mode, Tailwind 3.4, Zustand 4.5, Prisma 5.22 + MySQL, NextAuth v5 beta + hand-rolled `jose` JWT, Cloudinary SDK, Zod 3.25.
- `src/app` contains a storefront shell (home, shop, product, cart, checkout, auth) and an admin shell with 5 pages. `src/app/api` contains 42 route handlers, many duplicated (`/products` vs `/admin/products-manage`, `/orders/create` vs `/api/orders`, `/wishlist` vs `/wishlists`, four different admin order routes).
- Business logic is spread across `src/services/index.ts` (860 lines), `src/lib/repositories.ts` (600 lines), `src/actions/{cart,admin}.ts`, and route handlers, with overlapping and conflicting implementations.
- No migrations existed; schema had been applied via `db:push`. No automated tests existed (`"test": "jest"` with jest not installed). No `.env` file and no MySQL server in the environment.

## 2. Existing functionality that works

- Storefront static shell: RTL root layout, navbar, mobile drawer, hero, category showcase and footer styling.
- OTP request + verification via NextAuth credentials (with hashed OTP, expiry and attempt counting in `User`), albeit with significant flaws.
- Basic `/api/products`, `/api/categories`, admin list endpoints and a server checkout action that talks to Zarinpal.
- Base utilities: Persian number/price formatting, CN class merge, rate-limiter skeleton, Cloudinary helper.

## 3. Missing functionality

- Product data is mocked: `src/lib/sampleProducts.ts` (4 hardcoded products, USD prices) drives shop and product detail pages. No DB-backed filtering, sorting, search, category pages or pagination.
- Cart is browser localStorage only (`src/store/cartStore.ts`); `/api/cart/*` is not used by UI; no guest cart, no cart persistence across devices, no cart merge on login.
- Missing pages: category, search, account/profile, addresses, order history/details, wishlist, size guide, about, contact, shipping/returns/privacy/terms, and all admin detail/form pages.
- Admin dashboard statistics are hardcoded (`1234`, `567890`, …) and charts are placeholders. Delete buttons are stubs; "add/edit" links point to nonexistent routes.
- No inventory movements, low-stock alerts, coupon UI, return requests, audit log UI, configurable settings, or image-upload UI.
- No SMS provider (OTP printed to console), no real payment test path (a test button marks payment COMPLETED client-side), no payment idempotency, no tests, no SEO metadata/sitemap/robots/structured data.

## 4. Security weaknesses (with evidence)

| # | Weakness | Evidence | Impact |
|---|---|---|---|
| 1 | Schema does not validate/generate: `String? @db.Json` on `Payment.gatewayResponse` | `prisma/schema.prisma:384`, `npx prisma generate` → P1012 | Prisma client stale; `payment` property missing → ~15 TS errors |
| 2 | Middleware trusts and forwards client-supplied `x-user-id`/`x-user-role` headers | `src/middleware.ts:66-70` | Any caller can impersonate an admin by sending a header |
| 3 | Admin UI forces `x-user-role: ADMIN` | `src/app/admin/{products,orders,users}/page.tsx:30-40` | Authorization theatre |
| 4 | `isAdmin` hardcoded `true` in admin layout | `src/app/admin/layout.tsx:11-14` | No server-side RBAC |
| 5 | Checkout trusts client `cartJson` (items, prices, totals) | `src/app/checkout/page.tsx:33-94` | Price manipulation, free orders |
| 6 | Test payment marks order paid without provider verification | `src/app/checkout/page.tsx:100-121` | Unauthenticated "payment" bypass |
| 7 | OTP logged to console, no SMS adapter | `src/app/api/auth/login/route.ts:13-26` | OTP disclosure in logs |
| 8 | Hardcoded JWT fallback secret | `src/lib/jwt.ts:3-5` | Token forgery if env missing |
| 9 | No session table/revocation; NextAuth JWT only; Bearer tokens accepted in middleware | `src/auth.ts`, `src/middleware.ts:32-48` | No logout revocation, token theft resilience |
| 10 | RBAC roles only `CUSTOMER/ADMIN/VENDOR`; no permissions | `prisma/schema.prisma:48-52` | Cannot implement ordered managers/product managers safely |
| 11 | No real rate limiting on OTP (in-memory limiter is not wired) | `src/lib/rate-limit.ts`, `src/app/api/auth/login/route.ts` | Brute-force / SMS flooding |
| 12 | No CSRF defense for cookie-authenticated mutations; admin routes rely on headers | `src/middleware.ts`, admin routes | CSRF on state-changing requests |
| 13 | Upload route trusts filenames/MIME and has no image re-encoding | `src/app/api/upload/route.ts` | Malicious upload risk |
| 14 | No security headers (CSP, HSTS, frame protections) | `next.config.ts:3-26` | Clickjacking/XSS hardening missing |
| 15 | `sanitizeInput` strips `<`/`>` destructively and `hasSqlInjectionPatterns` blocks legitimate words ("from", "or") | `src/lib/security.ts:28-78` | Data corruption / false positives; neither prevents SQLi (Prisma does) |
| 16 | JWT stored in localStorage by `useAuth` | `src/hooks/index.ts:186` | XSS → token theft |
| 17 | No ownership checks on several customer/admin endpoints; IDOR possible | `src/app/api/users/orders/route.ts`, admin detail routes | Cross-customer data access |
| 18 | `formatPrice` calls money "IRR" then relabels it "تومان" | `src/lib/currency.ts:33-47` | 10× price error risk |

## 5. Database weaknesses

- No migrations, no seed of variants, no brand/role/permission/session/coupon/inventory/audit models.
- Money fields `Decimal(10,2)` but USD default and mixed units; stock duplicated on product and variant with no invariant; `@@unique([userId, productId, variantId])` on CartItem with nullable `variantId` permits duplicates in MySQL; no unique constraint on reviews; no FK for order address snapshot; `Payment` relation incomplete and schema invalid.
- No soft-delete timestamps, no indexes for common storefront queries, no stock-movement history.

## 6. Frontend / UX weaknesses

- Hardcoded mock data, dead links, placeholder buttons, English leftovers, RTL direction bugs (`MobileDrawer` slides off-screen), `outline: none` globally (no focus states), no dialog accessibility, no responsive admin tables, no skeletons/empty/error states. See `docs/IMPLEMENTATION_PLAN.md` task list.

## 7. Dependency issues

- `jose@6.2.3` installed but `package.json` declares `^5.4.0`; `@emnapi/runtime` extraneous; React 18 installed while docs claim 19. NextAuth v5 beta adds unnecessary surface. Jest script without jest dependency.

## 8. Implementation decision

The existing codebase is a non-building, insecure prototype: the schema cannot generate a client, TypeScript fails with 40+ errors, and the "working" flows depend on mock data and client-trusted prices. A thin-layer refactor would preserve the vulnerabilities. Therefore this implementation replaces the broken business-logic layer (`src/services`, `src/lib/repositories`, `src/actions`, legacy API routes) with a single authoritative domain layer, while retaining the visual language (luxury palette, RTL shell) and reusable pieces where sound. Every replaced behavior is documented in `docs/PROGRESS.md`.

## 9. Priorities

1. Valid schema + real migrations + admin bootstrap + join/seeded demo data.
2. Server-authoritative identity (OTP + sessions + RBAC) and CSRF-free, cookie-based API.
3. Domain services: catalog, cart, checkout, payment/inventory transactions, coupons.
4. Storefront pages and reusable, themeable component library.
5. Complete admin dashboard (overview, products, variants/inventory, orders, customers, coupons, settings, audit log).
6. Security headers, validation, tests, SEO, deployment docs.
