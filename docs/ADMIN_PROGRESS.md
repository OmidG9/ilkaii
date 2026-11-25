# Control Center — Implementation Progress

Updated: 2026-11-25

## Status legend

`[x]` implemented and verified · `[~]` implemented with an operator step ·
`[ ]` not implemented (documented, not claimed complete)

## Phase 1 — Admin foundation — `[x]`

- Dedicated `/admin` shell with persistent/collapsible sidebar, mobile drawer,
  sticky header, global search, notification center (derived from real records),
  profile menu, breadcrumbs, quick actions and date-range selector.
- Persian-first RTL, light/dark tokens, accessible controls, loading skeletons,
  empty states, error boundaries and responsive tables/cards.
- Reusable components: `AdminShell` (layout/sidebar/header), data table, filters,
  pagination, date picker, stat card, SVG charts, modal, drawer, notification
  center, empty state, CRUD manager, bulk table.
- Admin global search spans products, orders, customers and CMS content with
  role-based result filtering.

## Phase 2 — Central dashboard — `[x]`

- `/admin/dashboard` (and `/admin` redirect) uses real database metrics.
- Date filters: today, yesterday, 7/30 days, this month, previous month, custom.
- Gross revenue, refunds, net sales, discounts, shipping income, paid orders,
  pending/completed/cancelled, AOV, conversion, active sessions, customers,
  new/returning buyers, low stock, best sellers and recent orders.
- Daily/weekly/monthly sales, order trend, visitor trend, category/product sales
  and campaign traffic/source tables.
- Metrics unavailable without data render as `—`; definitions are on-page.

## Phase 3 — Full CMS — `[~]`

- `[x]` Homepage builder with 10 schema-validated section types, ordering,
  enable/disable, scheduling, validated JSON config, safe rendering, preview link.
- `[x]` Storefront renders active sections (fallback to original homepage).
- `[x]` Pages: create/edit, draft/scheduled/published/archived, SEO metadata,
  slug uniqueness, storefront route `/pages/[slug]`, sitemap entries.
- `[x]` Navigation: header/mobile/footer menus, nested items, internal/external
  links, ordering, active flags; navbar/footer consume the database menus.
- `[x]` Media library: upload, search/filter, alt text, storage usage, safe delete
  blocked while referenced.
- `[x]` Banner management (placement, schedule, order) and storefront rendering.
- `[x]` Blog CRUD with publish/schedule and storefront `/blog`.
- `[ ]` Draft page/homepage preview for authenticated admins (only the public
  active version is previewable today).
- `[ ]` Rich-text/Markdown editor. Content is stored and rendered as safe plain
  text; no HTML/JS execution.

## Phase 4 — Commerce management — `[~]`

- `[x]` Products/variants/images/pricing/status, categories, brands, inventory
  ledger, low-stock alerts, product duplication.
- `[x]` Bulk status, price (set/percent), stock (set/increment), feature and
  archive actions with transactions and audit logs.
- `[x]` Orders list/detail, validated status transitions, shipments, payments,
  cancellations, refunds with stock handling, returns processing.
- `[x]` Coupons CRUD, reviews moderation.
- `[~]` Orders/payments/shipments are managed through existing order detail flows;
  no standalone payment/shipment CRUD pages.
- `[ ]` Excel (`.xlsx`) export. CSV export is implemented; Excel-compatible BOM
  is included.

## Phase 5 — Customer CRM — `[x]`

- Rich customer profile: contact, registration, status, orders, spend, AOV, last
  purchase, addresses, wishlist, viewed products (when analytics exist), returns,
  reviews, current cart, internal notes and marketing consent.
- Segments: new, returning, VIP, high-value, inactive, cart abandoner, frequent
  cancellations. Filters by segment, spend, order count, activity, sort.
- CSV export with `customers.export`, audited.
- OTPs, tokens, secrets and payment data are never included.

## Phase 6 — Behavioural analytics engine — `[x]`

- All 15 required events, anonymous HttpOnly session cookie, UTM, device/browser,
  optional customer link, metadata allow-list, server-side validation.
- Deduplication by unique event id, bot filtering, per-session/IP rate limits,
  64 KB body cap and configurable consent.
- Daily aggregates, indexed raw-event queries, configurable retention via
  maintenance job.
- Dashboard: traffic, new/returning visitors, devices, landing/exit pages,
  product views/purchases/conversion, size/color distribution, add-to-cart and
  abandonment, configurable funnel with time-to-stage, search analytics,
  campaign performance, customer behaviour and CLV confidence labelling.
- Session explorer timeline with privacy controls.

## Phase 7 — Session insights — `[x]`

- Session list/detail, timeline, pages, product/search/cart/checkout events,
  device, traffic source and duration.
- No keystrokes, form contents, passwords, OTPs or payment data.
- Heatmap/replay integration point documented; heatmaps are off by default and
  not implemented.

## Phase 8 — Marketing center — `[~]`

- `[x]` Coupon management (existing), campaigns, subscriber management, abandoned
  cart view, campaign performance via UTM, customer segments.
- `[x]` SMS/email provider adapters with mock logging in development and hard
  production block when unconfigured.
- `[x]` Consent gating (`marketingOptIn`, subscriber status) and public
  newsletter signup + token-based unsubscribe.
- `[~]` Campaign dispatch is a manual audited action; there is no scheduler that
  automatically sends scheduled campaigns.
- `[ ]` Actual provider credentials and delivery verification.

## Phase 9 — Reporting center — `[~]`

- `[x]` Sales, revenue, product, category, inventory, customer, campaign, refund,
  shipping and retention reports with real records, date filtering, comparison
  period (sales/revenue), grouping, sorting (query-based) and CSV export.
- `[x]` Printable report view.
- `[ ]` Excel export and background generation for very large reports.

## Phase 10 — Settings & control — `[~]`

- `[x]` Store identity/logo/locale/currency/timezone, theme, contact, shipping,
  features, content, SEO defaults, analytics/privacy, order/invoice text and
  backup policy.
- `[x]` Encrypted integration secrets with masked display and super-admin-only
  access; storage usage; provider adapters.
- `[~]` Backup is policy/status only; actual backup execution is an external
  infrastructure responsibility.
- `[ ]` Remote secret manager (Vault/KMS). Current encryption key derives from
  `SESSION_SECRET`.

## Phase 11 — RBAC & admin security — `[x]`

- Eight admin roles + customer, custom roles, permission editor, role assignment,
  escalation guards, last-super-admin protection, session management, audit log
  (request id + before/after) and sensitive-operation confirmations.
- Server-side permission checks on every page/route; tests cover the matrix.

## Phase 12 — System health — `[x]`

- `/api/health` minimal public check; `/admin/system` shows app/DB/latency,
  failed payments/jobs, storage, recent system/security events, dependency
  warnings and backup status.
- Protected maintenance route runs scheduled publishing, retention and pruning,
  recording `BackgroundJob` rows.
- API 500s write best-effort `SystemEvent` records.

## Phase 13 — Testing — `[~]`

- `[x]` 47 unit tests: money/coupons/shipping, Persian helpers, validation,
  RBAC (incl. new roles/custom/aliases), Tehran date ranges, analytics schema,
  CSV escaping.
- `[x]` Live MySQL smoke tests for admin routes, analytics ingestion/dedup,
  CMS CRUD, role CRUD, bulk product actions, campaign dispatch (mock), secrets,
  reports/customer CSV, health and maintenance.
- `[ ]` Automated integration/E2E suite against a disposable database.
- `[ ]` Load test with production-size event volumes.

## Phase 14 — Performance & maintainability — `[~]`

- `[x]` Server pagination, indexes, precomputed daily aggregates, transaction
  boundaries, reusable services, error boundaries, responsive charts.
- `[x]` Analytics isolation from checkout (best-effort events, no blocking).
- `[~]` In-process rate limits/caches; move to Redis for multi-instance.
- `[ ]` Dedicated background queue for very large report exports.

## Phase 15 — Verification log

| Command | Result |
| --- | --- |
| `npx prisma migrate deploy` | 3 Control Center migrations applied to MySQL |
| `npm run type-check` | passes |
| `npm test` | 47/47 passing |
| `npm run build` | succeeds, all admin/storefront/API routes compiled |
| Admin route smoke (SUPER_ADMIN) | dashboard, analytics, reports, customers, CMS, marketing, settings, system, roles, users, security, audit, products, inventory, orders, returns, reviews, coupons → 200 |
| Analytics ingestion | accepted valid browser events; duplicate `eventId` → `duplicate`; `curl` UA → `bot`; consent endpoint works |
| CMS | page create → storefront `/pages/test-page` 200 → delete; homepage section create → rendered on `/` → delete |
| Product bulk/duplicate | duplicate 201, bulk price 200, archive 200 |
| Marketing | subscriber + campaign created, mock dispatch sent 1, cleanup 200 |
| CSV | sales + customer exports return `text/csv` with BOM |
| Maintenance/health | maintenance success; `/api/health` 200 |

## Remaining operator actions

1. Configure real SMS/email/Zarinpal credentials and verify live delivery/payment.
2. Add `CRON_SECRET` and schedule `POST /api/cron/maintenance`.
3. Move rate limiting and any cache to shared storage for multi-instance.
4. Run the full E2E suite against a disposable MySQL database in CI.
5. Decide whether to add draft preview, Markdown editor, Excel export, automated
   campaign scheduler and heatmaps in a later iteration.
