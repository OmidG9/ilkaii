# Security Audit — ilkaii

This document records the security controls implemented in the MVP and the
residual risks that require operator action before a production launch.

> Scope: application code in `src/`, Prisma schema, API routes, auth flows,
> payment/inventory integrity, uploads, headers and dependency posture.
> Not in scope: infrastructure hardening, WAF, DDoS, database network ACLs.

## 1. Authentication & sessions

| Control | Implementation |
| --- | --- |
| Passwordless login | 6-digit OTP, `randomInt` (crypto), bcrypt-hashed (`cost 10`), 10-minute TTL |
| Phone normalization | Iranian mobile formats normalized to `09xxxxxxxxx` before storage/lookup |
| OTP replay | `consumedAt` set atomically via `updateMany({ consumedAt: null })` |
| OTP brute force | Per-phone and per-IP sliding windows (8 / 15 min verify, 5 / 15 min request) + `attempts`/`maxAttempts` counter |
| Resend abuse | 60-second cooldown per phone |
| Session token | Signed JWT (HS256, `jose`) with random `jti`; **token hash stored in DB** |
| Session revocation | `revokedAt` + hash comparison re-checked on every request; rotation on login |
| Cookie | `HttpOnly`, `SameSite=Lax`, `Secure` in production, path `/` |
| Suspended accounts | `isActive=false` invalidates sessions and blocks OTP re-login |
| Dev OTP disclosure | `/api/auth/dev-otp` returns **404** when `NODE_ENV=production`; in-memory only |

Authorization is never read from the JWT: the current user, role and active
flag are loaded from the database on each request (`getSessionUser`).

## 2. Authorization (RBAC)

- Permission matrix lives in `src/lib/permissions.ts` and is provisioned
  idempotently into `Role`/`Permission`/`RolePermission`.
- Every admin API mutation calls `requirePermission(key)`; every admin page is
  guarded by `requirePageAdmin()` in `src/app/admin/layout.tsx`.
- Role changes are restricted to `SUPER_ADMIN`, cannot target the actor's own
  account, and keep the `UserRole` join table in sync.
- There is **no public admin registration**. The first admin is granted via the
  operator-only CLI (`npm run admin:grant`).

| Role | Scope |
| --- | --- |
| SUPER_ADMIN | everything, including `setting.write` and role grants |
| ADMIN | all except settings and role grants |
| ORDER_MANAGER | orders + read customers |
| PRODUCT_MANAGER | products, inventory, coupons |
| CUSTOMER | storefront only |

## 3. Request integrity

- **CSRF**: cookie-authenticated mutations call `assertSameOrigin()` (Origin must
  match Host, HTTPS except localhost). Payment gateway callbacks are exempt and
  verified by authority/reference lookup.
- **Input validation**: every API body/query is parsed with Zod schemas; unknown
  keys are stripped.
- **Body size**: request bodies limited to 64 KB before JSON parsing.
- **Idempotency**: checkout requires `x-idempotency-key`; payments are unique on
  `idempotencyKey` / `authority`.
- **Server-authoritative money**: subtotal, discounts, shipping and totals are
  recomputed from database rows; client values are never trusted.
- **Stock reservation**: conditional `updateMany({ stock: { gte: quantity } })`
  prevents oversell under concurrency; signed `InventoryMovement` audit rows.
- **Payment failure compensation**: if the gateway cannot start a session, the
  committed order is cancelled and stock restored (`compensateInitiation`).
- **Callback replay**: `finalizePayment` short-circuits already-paid/failed
  payments and re-verifies amount before changing state.

## 4. Data protection

- Passwords are never stored (passwordless only). OTPs are bcrypt hashes.
- Payment card data never touches this system; only gateway references are kept.
- Order items store immutable snapshots (name, SKU, unit price) for auditability.
- Audit log (`AuditLog`) records actor, action, entity, IP and JSON metadata;
  write failures never break the business transaction.
- Secrets are validated lazily from environment (`src/lib/env.ts`); the build
  phase uses a placeholder and never requires production secrets.

## 5. Uploads & media

- Admin-only upload endpoint (`product.write`).
- File type detected from **magic bytes**; declared MIME must match.
- Max 5 MB, minimum 200×200, maximum 8000×8000, `limitInputPixels` 40 MP.
- Images are re-encoded to WebP with `sharp`, stripping metadata/scripts;
  SVG and AVIF **input** are rejected.
- Remote image hosts are an explicit allowlist (`remotePatterns`), default
  `res.cloudinary.com` plus `NEXT_PUBLIC_IMAGE_HOSTS`; SVG optimization is off.

## 6. HTTP headers

Set centrally in `src/middleware.ts` for every non-static route:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` + CSP `frame-ancestors 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera/mic/geolocation/payment
- `Cross-Origin-Opener-Policy: same-origin`
- `Strict-Transport-Security` in production
- CSP: `default-src 'self'`, inline scripts/styles allowed (Next.js + theme),
  `img-src` limited to self/data/blob/https, `object-src 'none'`.

`poweredByHeader` is disabled.

## 7. Rate limiting

Process-local sliding windows cover OTP request/verify. The bucket map is
bounded (10k entries, expired entries pruned) to prevent memory exhaustion.

**Limitation:** the limiter is per Node process. Multi-instance deployments
must swap `checkRateLimit` for Redis/DB-backed storage.

## 8. Dependency audit

`npm audit --omit=dev` after `npm audit fix`:

| Package | Severity | Status |
| --- | --- | --- |
| next (15.5.x) | critical/high advisories | Accepted; see mitigations |
| sharp | high (libvips/libheif/librsvg CVEs) | Accepted; admin-only uploads, re-encoded output |
| zod (3.x) | high (memory on oversized collections) | Accepted; 64 KB body cap, small arrays |
| postcss | high (source-map handling) | Build-time only |

Mitigations for the Next.js advisories:

- The application **does not use Server Actions** (all mutations are explicit
  route handlers with `assertSameOrigin` + RBAC).
- Image optimization only serves allowlisted remote hosts and re-encoded local
  uploads; SVG/AVIF input is rejected.
- `NEXT_PUBLIC_BASE_URL` should be fixed so rewrite destinations are not
  attacker-controlled.

**Recommended before launch:** schedule a Next.js major upgrade (16.x) and a
zod 4 migration in a dedicated change set, then re-run `npm audit`, the test
suite and a full build.

## 9. Known limitations / operator actions

1. Run `prisma migrate deploy` against a real MySQL instance and execute the
   integration/E2E suites (no database was reachable in this environment).
2. Configure a production SMS provider and payment merchant ID; verify callback
   signatures with the real gateway.
3. Move rate limiting to shared storage for multi-instance deployments.
4. Replace `console`/structured logger sink with your log platform if required.
5. Add a WAF/edge rate limit for `/api/auth/*` and `/api/checkout`.
6. Rotate `SESSION_SECRET` on incident; all sessions become invalid because the
   token hash is stored server-side.
