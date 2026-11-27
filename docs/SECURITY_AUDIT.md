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
| CONTENT_MANAGER | CMS pages, homepage, banners, menus, media, blog |
| MARKETING_MANAGER | campaigns, subscribers, coupons, analytics reads |
| ANALYST | analytics/reports/audit reads and exports |
| SUPPORT_AGENT | customer reads, order reads, limited customer updates |
| CUSTOMER | storefront only |

The Control Center extended RBAC with custom roles and namespaced permissions.
See `docs/ADMIN_SECURITY.md` for escalations guards, encrypted integration
secrets, admin session revocation, audit snapshots and analytics privacy
controls. Every new admin route is permission-checked independently; hiding a
navigation item is never an authorization mechanism.

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
- Local uploads are written to `LOCAL_UPLOAD_DIR` (default `public/uploads`) and
  served by `/uploads/[...path]`; path traversal, symlinked paths and
  non-image extensions are rejected. Production must use Cloudinary or a
  persistent writable volume; a read-only filesystem returns a clear 503.

## 6. HTTP headers

Set centrally in `src/middleware.ts` for every non-static route:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` + CSP `frame-ancestors 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera/mic/geolocation/payment
- `Cross-Origin-Opener-Policy: same-origin`
- `Strict-Transport-Security` in production
- CSP in production: `default-src 'self'`, **per-request nonce** for scripts with
  `'strict-dynamic'` and no `unsafe-inline`; the nonce is applied to Next's
  bootstrap scripts, the theme bootstrap and JSON-LD. `style-src` still allows
  inline styles (Tailwind/theme), `img-src` is limited to self/data/blob/https,
  `object-src 'none'`. `form-action` also permits Behpardakht's bank POST.
- Development uses a relaxed inline/eval CSP because the Next dev overlay cannot
  be nonced; production is the enforced policy.

`poweredByHeader` is disabled.

## 7. Rate limiting

OTP request/verify, analytics ingestion, consent and newsletter endpoints use a
sliding-window limiter:

- With `REDIS_URL`, counters are shared across instances using an atomic
  `INCR`+`PEXPIRE` Lua script. Keys are SHA-256 hashes, so phone numbers and IPs
  never appear in Redis.
- Without Redis, a bounded in-process fallback (10k entries, expired pruning)
  keeps single-instance and development environments working.
- If Redis errors, the limiter degrades to the local fallback for 30 seconds
  and logs the outage rather than failing logins.
- Redis is required for correct multi-instance enforcement; the process-local
  fallback is explicitly single-instance only.

## 8. Dependency audit

Current `npm audit --omit=dev` posture:

| Package | Severity | Status |
| --- | --- | --- |
| sharp | high (libvips/libheif/librsvg CVEs) | **Fixed**: upgraded to 0.35.5 and verified |
| zod (3.x) | high (memory on oversized collections) | Open; requires zod 4.6.7+ (major) |
| postcss (bundled in Next 15) | high (source-map handling) | Open; fixed in Next 16.4.6+ (major) |

Mitigations until the majors land:

- 64 KB request-body cap and bounded array/collection schemas reduce the zod
  DoS surface.
- PostCSS is a build-time tool in this app; Next's bundled copy is not exposed
  to user-controlled CSS/source maps.
- The application **does not use Server Actions** (all mutations are explicit
  route handlers with `assertSameOrigin` + RBAC).
- Image optimization only serves allowlisted remote hosts and re-encoded local
  uploads; SVG/AVIF input is rejected.
- `NEXT_PUBLIC_BASE_URL` must be fixed so rewrite destinations are not
  attacker-controlled.

`tests/regression.test.ts` is the contract gate for the zod 4 / Next 16 work and
`docs/UPGRADE_PLAN.md` lists the exact sequence. Do not run `npm audit fix
--force` on the release branch.

## 9. Known limitations / operator actions

1. **Gateway refund calls are not automated.** The app now keeps a partial/full
   refund ledger (amount, bank reference, operator) and updates order/payment
   status when the paid amount is covered. The actual bank/gateway refund must be
   performed in the provider panel first; gateway-specific refund APIs are not
   called.
2. Configure a production SMS provider and payment merchant ID; verify callbacks
   with the real gateway (Zarinpal, Zibal or Behpardakht sandbox).
3. Set `REDIS_URL` for multi-instance rate limiting.
4. Use a persistent volume via `LOCAL_UPLOAD_DIR` or Cloudinary; serverless
   local uploads are rejected with a clear error.
5. Schedule `/api/cron/maintenance` hourly to expire unpaid orders and apply
   analytics retention.
6. Replace `console`/structured logger sink with your log platform if required.
7. Add a WAF/edge rate limit for `/api/auth/*` and `/api/checkout`.
8. Rotate `SESSION_SECRET` on incident; all sessions become invalid because the
   token hash is stored server-side.
9. Next.js 16 / zod 4 upgrades are planned in `docs/UPGRADE_PLAN.md`; the
   sharp 0.35.5 upgrade is already applied.
