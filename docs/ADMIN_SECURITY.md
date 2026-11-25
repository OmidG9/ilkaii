# Admin Security Model

This document describes the Control Center security controls and the residual
risks that require operator action. It complements `docs/SECURITY_AUDIT.md`.

## 1. Roles and permissions

Role codes are strings so custom roles are possible. Built-in roles are seeded
idempotently from `src/lib/permissions.ts`:

| Role | Default scope |
| --- | --- |
| `SUPER_ADMIN` | Unrestricted, including settings, secrets and role management |
| `ADMIN` | Store operations except settings/secrets and role grants |
| `PRODUCT_MANAGER` | Products, variants, inventory, categories, brands |
| `ORDER_MANAGER` | Orders, returns, shipping, customer reads |
| `CONTENT_MANAGER` | CMS pages, homepage, banners, menus, media, blog |
| `MARKETING_MANAGER` | Campaigns, subscribers, coupons, analytics reads/exports |
| `ANALYST` | Analytics/reports/audit reads and exports, no mutations |
| `SUPPORT_AGENT` | Customer reads, order reads, limited customer updates |
| `CUSTOMER` | Storefront only |

Namespaced permissions (`products.update`, `orders.view`, `cms.manage`, …) are
the canonical keys. Legacy keys (`product.write`, `order.read`, …) are kept as
aliases for existing routes and are expanded automatically when a role is
edited in the UI.

## 2. Server-side enforcement

- Every admin page calls `requirePageAdmin` in `src/app/admin/layout.tsx` and a
  permission guard in the page itself.
- Every mutation route calls `requirePermission`/`requireAnyPermission`.
- `getSessionUser` reloads the user, role and active flag from the database on
  every request; roles are never trusted from the JWT.
- `assignUserRole` prevents self role changes, prevents non-super-admins from
  granting/removing `SUPER_ADMIN`, and refuses to remove the last active
  super admin.
- Suspending a user revokes all their sessions.
- `SUPER_ADMIN` role permissions are not editable; at least one active super
  admin must remain.

## 3. Secrets

- Integration credentials live in `IntegrationSecret`, encrypted with
  AES-256-GCM. The key is derived from `SESSION_SECRET` via SHA-256.
- The dashboard receives only a masked hint and a last-updated timestamp. The
  plaintext is read only by server-side provider adapters.
- Roles without `settings.manage` cannot read secret metadata or write secrets.
- Rotating `SESSION_SECRET` invalidates sessions and makes stored secrets
  undecryptable; re-enter them after rotation.
- Audit snapshots redact keys matching secret/token/password/OTP/card/merchant
  patterns.

## 4. Audit logging

`AuditLog` records actor, action, entity, entity id, timestamp, severity, IP,
request correlation id and safe before/after snapshots for sensitive mutations
(products, CMS, roles, settings, customer notes, refunds, exports, secret
changes). Audit writes are best-effort and never break the business operation.
Credentials and payment data are never logged.

## 5. Sessions & request integrity

- HttpOnly, SameSite=Lax session cookie; Secure in production; DB token hash,
  expiry, revocation.
- Admin session list exposes IP/user-agent/expiry and supports revocation.
- Cookie-authenticated mutations require same-origin (`assertSameOrigin`).
- Zod validation on every API body/query, 64 KB body cap.
- Rate limits: OTP, analytics ingestion/consent, newsletter, admin actions
  where applicable. The limiter is process-local and must move to Redis/DB for
  multi-instance deployments.
- Uploads: magic-byte validation, MIME match, 5 MB/40 MP caps, WebP re-encode,
  SVG/HTML rejected; media deletion is blocked while referenced.

## 6. Privacy of analytics and CRM data

- Customer profile shows only business-necessary data. OTP hashes, session
  tokens, payment credentials and password material are never exposed.
- Analytics metadata is allow-listed; sensitive keys are rejected by validation.
- IP addresses are hashed; no fingerprinting or full replay.
- Marketing dispatch requires `marketingOptIn`/active subscriber status and is
  blocked without a configured provider in production.
- CSV exports require `customers.export` / `reports.view` and are audited.

## 7. Known residual risks / operator actions

1. Process-local rate limiting: replace with shared storage for multiple
   instances.
2. `SESSION_SECRET` rotation requires re-entering integration secrets.
3. Next.js 15/zod 3 dependency advisories remain; see `SECURITY_AUDIT.md`.
4. Real SMS/email/Zarinpal credentials must be configured and verified; mock
   adapters are blocked in production.
5. Backups are external to the app; the dashboard only records policy/status.
6. CSP allows inline scripts/styles because Next.js and runtime theme tokens
   require them. Review with a nonce/hash-based CSP before a high-security
   deployment.
7. No WAF/DDoS protection is bundled; add at the edge.
