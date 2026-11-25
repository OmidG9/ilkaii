# Analytics Architecture

First-party, privacy-conscious behavioural analytics for the ilkaii control
center. Analytics is isolated from checkout: ingestion failures never block a
purchase and purchase/refund events are best-effort side effects.

## 1. Collection flow

```
Browser (consent-aware tracker)
  └─ POST /api/analytics/collect  { eventId, name, path, UTM, product ids, metadata }
       ├─ same-origin + 64 KB payload cap + Zod validation
       ├─ per-session (180/min) and per-IP (600/min) rate limits
       ├─ anonymous HttpOnly session cookie (ilkaii_aid, random 32-hex)
       ├─ UA bot filter; customer id only when a real session exists
       ├─ deduplication by unique eventId (createMany skipDuplicates)
       ├─ optional consent enforcement (SiteSetting analytics.requireConsent)
       └─ transaction: session upsert + event insert + daily aggregate increment
```

Events accepted (Zod enum):

`page_view`, `product_view`, `category_view`, `search`, `filter_applied`,
`variant_selected`, `add_to_cart`, `remove_from_cart`, `wishlist_add`,
`begin_checkout`, `add_shipping_info`, `payment_initiated`, `purchase`,
`refund`, `review_submitted`.

Properties: event id, anonymous session id, optional customer id, event name,
timestamp, page path, referrer, device/browser category, UTM source/medium/
campaign, product/category/variant ids, event-specific metadata (max 20 keys,
no password/OTP/token/card/secret keys).

## 2. Storage model

| Table | Purpose |
| --- | --- |
| `AnalyticsSession` | Anonymous session lifecycle, entry/exit path, UTM, device, bounce, consent flag, hashed IP |
| `AnalyticsEvent` | Immutable event rows, unique `eventId`, indexed by name/date, session, product, category, UTM |
| `AnalyticsDailyAggregate` | Precomputed daily counters (sessions, visitors, page/product views, carts, checkouts, purchases, revenue) |
| `AnalyticsConsent` | Per-session/customer analytics & marketing consent record |

The dashboard uses precomputed daily counters for trend charts and indexed
raw-event queries for dimension breakdowns. No analytics query runs per
storefront request.

## 3. Consent & privacy

- Session identity is a random server-issued cookie. No fingerprinting, canvas,
  device IDs or cross-site identifiers.
- IP addresses are stored only as SHA-256 hashes (truncated) for abuse analysis.
- No passwords, OTPs, card data, form values, keystrokes or payment credentials
  are collected.
- If `analytics.requireConsent=true`, the storefront shows a consent banner and
  ingestion is rejected until the customer grants analytics consent.
- `privacy.marketingConsent` + `User.marketingOptIn`/subscriber status gate all
  marketing messages.
- Retention is configurable (`analytics.retentionDays`, default 180) and applied
  by the maintenance job.
- Session explorer exposes only approved event properties and requires
  `analytics.view`; raw logs are never public.

## 4. Metric definitions

- **Visitors/sessions**: anonymous sessions whose `firstSeenAt` is in the range.
- **Page views**: count of `page_view` events.
- **Bounce rate**: sessions with `isBounced=true` ÷ sessions.
- **Average session duration**: avg(lastSeenAt − firstSeenAt) in seconds.
- **Pages/session**: total page views ÷ sessions.
- **Add-to-cart rate**: sessions with `add_to_cart` ÷ sessions with `product_view`.
- **Product abandonment**: product-view sessions without add-to-cart ÷ product-view
  sessions.
- **Product conversion**: purchased units ÷ product views (observed events, not
  modelled).
- **Funnel**: distinct sessions reaching each stage:
  visitor → product_view → add_to_cart → begin_checkout → payment_initiated →
  purchase. Stage conversion is relative to the first stage and previous stage;
  drop-off = 100 − stage conversion. Time-to-stage is the average time from
  session start to the first occurrence of that stage.
- **Search**: keyword frequency from `metadata.query`; zero-result count from
  `metadata.results=0`; search-to-product/purchase uses sessions with a search
  event and a later event of that type.
- **Campaign revenue**: sum of `purchase` event `metadata.revenue` for sessions
  attributed to the UTM campaign, minus `refund` events. This is session-level
  attribution and can differ slightly from financial order reports.
- **Repeat purchase rate**: customers with ≥2 paid orders (lifetime) ÷ customers
  with ≥1 paid order.
- **CLV**: average lifetime spend per buyer; labelled *observed* only when at
  least 20 buyers exist, otherwise "insufficient data" and not presented as a
  reliable estimate.
- **Time to first purchase**: average days between user registration and first
  paid order for customers whose first paid order falls in the range.

All timestamps are stored in UTC and grouped by Asia/Tehran (UTC+03:30, no DST
since 2022). SQL date grouping uses an explicit `INTERVAL 210 MINUTE` shift.

## 5. Client integration

- `AnalyticsTracker` emits `page_view` on route changes when allowed.
- `TrackEvent` emits product/category/search/filter views.
- `VariantPicker` emits variant selection, add-to-cart and wishlist events.
- Cart and checkout emit removal, checkout start, shipping info and payment
  initiation.
- Server-side purchase/refund events use the order's `analyticsSessionId`
  captured at checkout, so revenue attribution survives the redirect/callback.
- Every client call is fire-and-forget (`keepalive`); failures are ignored.

## 6. Operational jobs

`POST /api/cron/maintenance` with `Authorization: Bearer $CRON_SECRET`:

1. Publishes due scheduled CMS pages/posts.
2. Deletes raw events/sessions older than the retention window.
3. Prunes system events older than 30 days.
4. Records a `BackgroundJob` success/failure row for the health page.

The same job is available to super admins at `/admin/system`.

## 7. Extension point for heatmaps / replay

Heatmaps are intentionally **off**. A future integration should:

- be a separate module with its own consent flag,
- capture only approved coordinates and no input contents,
- exclude sensitive routes (auth, checkout, account),
- honour retention and deletion controls,
- never enable full session replay by default.

No third-party analytics SDK is bundled.
