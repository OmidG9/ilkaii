# ILKAII Control Center — Dashboard Plan

This document is the implementation map for the administration control center.
It extends the existing storefront and domain layer; it does not replace them.

## 1. Architecture

```
src/app/admin/*            Server-rendered administration pages (RBAC-guarded)
src/components/admin/*     Control Center design system and client editors
src/app/api/admin/*        Permission-checked admin mutations and exports
src/app/api/analytics/*    Public, validated event ingestion + consent
src/app/api/cron/*         Secret-protected maintenance jobs
src/services/*             Domain services (dashboard, analytics, cms, crm,
                           marketing, reports, rbac, system, …)
src/lib/*                  Auth, permissions, secrets, date ranges, validation
prisma/schema.prisma       Source of truth for persisted business data
```

All admin pages are server components. They call `requirePagePermission` /
`requirePageAnyPermission`; every mutation route independently calls
`requirePermission` / `requireAnyPermission`. Hiding UI is never the control.

## 2. Navigation map

| Area | Routes | Permission |
| --- | --- | --- |
| Overview | `/admin/dashboard`, `/admin/reports` | `dashboard.view`, `reports.view` |
| Sales | `/admin/orders`, `/admin/returns`, `/admin/customers`, `/admin/customers/[id]` | `orders.view`, `customers.view` |
| Catalog | `/admin/products`, `/admin/products/[id]`, `/admin/categories`, `/admin/brands`, `/admin/inventory`, `/admin/reviews` | `products.view`, `inventory.manage` |
| CMS | `/admin/cms`, `/admin/cms/pages`, `/admin/cms/homepage`, `/admin/cms/banners`, `/admin/cms/menus`, `/admin/cms/media`, `/admin/cms/blog`, `/admin/cms/footer` | `cms.manage` |
| Marketing | `/admin/marketing`, `/admin/marketing/campaigns`, `/admin/marketing/subscribers`, `/admin/marketing/abandoned-carts`, `/admin/coupons` | `marketing.manage` |
| Analytics | `/admin/analytics`, `/admin/analytics/sessions`, `/admin/analytics/sessions/[id]` | `analytics.view` |
| System | `/admin/settings`, `/admin/users`, `/admin/roles`, `/admin/security`, `/admin/audit`, `/admin/system` | `settings.manage`, `users.manage`, `audit.view`, `system.view` |

## 3. Data model additions

- **CMS**: `CmsPage`, `HomepageSection` (validated JSON config), `Banner`,
  `Menu`, `MenuItem`, `MediaAsset`, `BlogPost`.
- **Analytics**: `AnalyticsEvent`, `AnalyticsSession`, `AnalyticsDailyAggregate`,
  `AnalyticsConsent`.
- **Marketing**: `MarketingCampaign`, `NewsletterSubscriber`, `NotificationLog`.
- **Operations**: `IntegrationSecret`, `BackgroundJob`, `SystemEvent`.
- **Identity**: role codes are strings (custom roles supported); `User.adminNote`,
  `marketingOptIn`, `lastActivityAt`; `Order.analyticsSessionId` for campaign
  attribution.
- **Audit**: `AuditLog.requestId`, `beforeJson`, `afterJson`.

Migrations:

1. `20261125120000_control_center_core`
2. `20261125130000_order_analytics_link`
3. `20261125140000_newsletter_unsubscribe`

## 4. Dashboard definitions

Calculated in `src/services/dashboard.ts`; all boundaries use Asia/Tehran.

- **Gross revenue**: sum of `totalAmount` for orders with `paymentStatus=PAID`
  whose `paidAt` (fallback `createdAt`) is inside the range.
- **Refunds**: sum of `totalAmount` for orders moved to `REFUNDED` inside the range.
- **Net sales**: gross revenue − refunds (never below zero).
- **Paid orders**: count of paid orders in the range.
- **AOV**: gross revenue ÷ paid orders (unavailable when zero).
- **Conversion rate**: paid orders ÷ analytics sessions; `—` when no sessions.
- **New/returning buyers**: distinct paid buyers in range, split by whether they
  had a paid order before the range started.
- **Low stock**: active variants with `stock <= 5` (or their threshold in
  inventory/report views).
- **Active sessions**: sessions whose `lastSeenAt` is within 30 minutes.

Unavailable metrics render as `—`. No demo/fake values exist in the service.

## 5. Reusable admin components

`AdminShell`/`AdminLayout`, sidebar with permission-filtered sections, header,
global search, notification center, profile menu, breadcrumbs, quick actions,
date-range picker, stat cards, responsive SVG charts, data table, filters,
pagination, modal, drawer, empty/loaded/error states, role editor, CRUD manager,
bulk product table, media manager, homepage builder, menu manager.

## 6. Product & inventory administration

- Server-side pagination, search, status filters and sorting.
- Bulk status, price (set / percent), stock (set / increment), featured and
  archive actions; stock changes write `InventoryMovement` rows and recalculate
  product aggregates inside a transaction.
- Product duplication copies images and variants as a DRAFT with zero stock.
- Archive is a soft delete (`isDeleted` + `DISCONTINUED`); historical order
  snapshots are preserved.
- Low-stock alerts in the dashboard, sidebar notifications and inventory page.

## 7. CMS behavior

- Homepage sections are schema-validated per type. Unknown fields are stripped;
  the renderer always escapes text and never executes administrator HTML/JS.
- Sections support enable/disable, ordering, scheduling and preview through the
  storefront.
- Pages/blog support draft, scheduled and published states with SEO fields.
- Menus support nested items, internal/external links, ordering and active flags.
- Media deletion is blocked while the URL is referenced by products, banners,
  pages or posts.
- Fallback: if no homepage section is active, the original storefront home page
  is rendered unchanged.

## 8. Verification

Required for every change set: `npm run type-check`, `npm test`, `npm run build`.
See `docs/ADMIN_PROGRESS.md` for the latest results and remaining operator steps.
