# ILKAII CONTROL CENTER

# MASTER ADMIN DASHBOARD & BEHAVIORAL INTELLIGENCE IMPLEMENTATION

## ROLE

Act as a Senior Software Architect, Full-Stack Engineer, E-commerce Administrator Platform Engineer, Data Analyst, UX Architect, and Application Security Engineer.

Your task is to extend the existing ilkaii e-commerce project by building a comprehensive, production-ready administrative control center.

The dashboard must provide centralized control over the entire store, similar in breadth to WordPress and WooCommerce, but specifically designed for a premium fashion e-commerce business.

This is an extension of the existing application, not a new independent project.

Do not rewrite existing working modules unnecessarily.

Use the existing:

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- MySQL
- Existing authentication system
- Existing product, order, inventory, and customer models

First inspect the actual implementation and reuse existing business logic.

---

# PHASE 1 — ADMIN DASHBOARD FOUNDATION

Create a dedicated administration interface under:

/admin

Build a professional, responsive administration layout.

Design requirements:

- Premium enterprise dashboard.
- Persistent sidebar navigation.
- Collapsible sidebar.
- Responsive mobile navigation.
- Top navigation bar.
- Global search.
- Notification center.
- User profile menu.
- Breadcrumb navigation.
- Quick actions.
- Date range selector.
- Persian-first RTL interface.
- Persian typography.
- Light and dark theme support.
- Consistent design tokens.
- Accessible controls.
- Loading skeletons.
- Empty states.
- Error states.

Create reusable components:

- AdminLayout
- AdminSidebar
- AdminHeader
- AdminBreadcrumbs
- AdminDataTable
- AdminSearch
- AdminFilters
- AdminPagination
- AdminDateRangePicker
- AdminStatCard
- AdminChart
- AdminModal
- AdminDrawer
- AdminNotificationCenter
- AdminEmptyState

Use consistent UI patterns throughout all administrative pages.

---

# PHASE 2 — CENTRAL DASHBOARD

Implement:

/admin/dashboard

Display real database-backed metrics:

- Total revenue.
- Net sales.
- Total orders.
- Pending orders.
- Completed orders.
- Cancelled orders.
- Total customers.
- New customers.
- Returning customers.
- Average order value.
- Conversion rate.
- Active sessions.
- Low-stock products.
- Best-selling products.
- Recently placed orders.

Provide:

- Daily sales chart.
- Weekly sales chart.
- Monthly sales chart.
- Visitor trend chart.
- Order trend chart.
- Revenue comparison.
- Sales by category.
- Sales by product.
- Sales by traffic source.

Date filtering must support:

- Today.
- Yesterday.
- Last 7 days.
- Last 30 days.
- This month.
- Previous month.
- Custom date range.

Use accurate business definitions.

Clearly distinguish gross revenue, net sales, refunds, and paid orders.

Never use fake statistics.

Display unavailable metrics as unavailable rather than inventing values.

---

# PHASE 3 — FULL CMS

Implement a configurable content management system.

Routes:

/admin/cms
/admin/cms/pages
/admin/cms/homepage
/admin/cms/banners
/admin/cms/menus
/admin/cms/media
/admin/cms/blog
/admin/cms/footer

Capabilities:

### Homepage Builder

Create a section-based homepage management system.

Supported section types:

- Hero.
- Banner.
- Featured categories.
- Featured products.
- New arrivals.
- Best sellers.
- Promotional sections.
- Seasonal collections.
- Testimonials.
- Custom content blocks.

Allow administrators to:

- Add sections.
- Remove sections.
- Reorder sections.
- Enable or disable sections.
- Edit section content.
- Upload images.
- Configure buttons and links.
- Schedule publication.
- Preview changes before publishing.

Use a validated section schema.

Do not execute arbitrary administrator-supplied HTML or JavaScript.

### Page Management

- Create pages.
- Edit pages.
- Publish and unpublish.
- Draft support.
- SEO metadata.
- Slug management.
- Page preview.
- Publication scheduling.

### Navigation Management

- Main menu.
- Footer menu.
- Nested menu items.
- Custom internal links.
- External links.
- Drag-and-drop ordering.

### Media Library

- Upload images.
- Search assets.
- Filter by type.
- Image preview.
- Image metadata.
- Safe deletion.
- Storage usage reporting.

Preserve references to existing media assets.

---

# PHASE 4 — COMPLETE E-COMMERCE MANAGEMENT

Implement centralized management for:

- Products.
- Product variants.
- Categories.
- Brands.
- Product images.
- Pricing.
- Discounts.
- Stock.
- Inventory movements.
- Orders.
- Payments.
- Shipments.
- Coupons.
- Reviews.
- Return requests.

Include:

- Bulk actions.
- Advanced filters.
- Search.
- Sorting.
- Pagination.
- Excel/CSV export.
- Product duplication.
- Bulk price updates.
- Bulk stock updates.
- Inventory history.
- Low-stock alerts.

All changes must be persisted in the actual database.

Use transactions for critical inventory operations.

Require confirmation for destructive operations.

Prefer archiving over permanently deleting historical business records.

---

# PHASE 5 — CUSTOMER MANAGEMENT / CRM

Implement:

/admin/customers

Create a comprehensive customer profile.

Display:

- Customer information.
- Registration date.
- Phone number.
- Account status.
- Total orders.
- Total spending.
- Average order value.
- Last purchase.
- Addresses.
- Wishlist.
- Viewed products, when available.
- Order history.
- Return history.
- Customer activity summary.

Implement customer segmentation:

- New customers.
- Returning customers.
- VIP customers.
- Inactive customers.
- High-value customers.
- Cart abandoners.
- Customers with frequent cancellations.

Support filtering by:

- Registration date.
- Purchase date.
- Total spending.
- Order count.
- Customer segment.
- Last activity.

Allow CSV/Excel export with appropriate permissions.

Do not expose OTPs, authentication secrets, payment credentials, or unnecessary sensitive personal information.

---

# PHASE 6 — BEHAVIORAL ANALYTICS ENGINE

Build a first-party analytics system.

Route:

/admin/analytics

The analytics system must collect meaningful user interactions and transform them into actionable business metrics.

## Event Tracking

Implement these events:

- page_view
- product_view
- category_view
- search
- filter_applied
- variant_selected
- add_to_cart
- remove_from_cart
- wishlist_add
- begin_checkout
- add_shipping_info
- payment_initiated
- purchase
- refund
- review_submitted

Each event should support relevant properties:

- Event ID.
- Anonymous session ID.
- Optional authenticated customer ID.
- Event name.
- Timestamp.
- Page path.
- Referrer.
- Device category.
- Browser category.
- UTM source.
- UTM medium.
- UTM campaign.
- Product ID when relevant.
- Category ID when relevant.
- Variant ID when relevant.
- Event-specific metadata.

Use an anonymous, privacy-conscious session identifier.

Do not collect passwords, OTPs, card data, private form contents, or unnecessary personal information.

Do not use fingerprinting to identify users.

Implement event deduplication and basic bot filtering.

Use server-side validation for event ingestion.

Apply rate limits and payload size limits.

Implement configurable retention policies.

Provide a consent-aware analytics configuration for non-essential tracking.

## Analytics Database

Design an appropriate event storage model.

Consider:

- AnalyticsEvent.
- AnalyticsSession.
- AnalyticsDailyAggregate.
- AnalyticsConsent.

Use appropriate indexes and query strategies.

Avoid excessive database queries on every dashboard page load.

Use aggregation jobs or precomputed summaries when necessary.

Do not create unnecessary duplicate analytics records.

## Analytics Dashboard

Implement:

### Traffic Analytics

- Unique visitors.
- Total sessions.
- Page views.
- New vs returning visitors.
- Average session duration.
- Pages per session.
- Traffic sources.
- Device distribution.
- Landing pages.
- Exit pages.

### Product Analytics

- Most viewed products.
- Most purchased products.
- Products with high views and low purchases.
- Product conversion.
- Size selection distribution.
- Color selection distribution.
- Add-to-cart rate.
- Product abandonment.

### Funnel Analytics

Implement configurable funnels:

1. Visitor.
2. Product view.
3. Add to cart.
4. Checkout.
5. Payment initiation.
6. Purchase.

Display:

- Number of users at each stage.
- Conversion percentage.
- Drop-off percentage.
- Time between stages.

Define conversion metrics consistently and document their formulas.

### Search Analytics

- Most searched keywords.
- Searches without results.
- Search-to-product-view rate.
- Search-to-purchase rate.

### Campaign Analytics

- UTM source.
- UTM medium.
- UTM campaign.
- Sessions per campaign.
- Purchases per campaign.
- Revenue per campaign.
- Conversion per campaign.

### Customer Behavior

- New vs returning customers.
- Repeat purchase rate.
- Purchase frequency.
- Time to first purchase.
- Customer lifetime value where sufficient historical data exists.

Clearly distinguish observed data from estimated metrics.

Never invent analytics data.

---

# PHASE 7 — SESSION & INTERACTION INSIGHTS

Implement a privacy-conscious session analysis interface.

Display:

- Session timeline.
- Pages visited.
- Product interactions.
- Search actions.
- Cart actions.
- Checkout progression.
- Device category.
- Traffic source.
- Session duration.

Do not expose sensitive session information to unauthorized administrators.

Do not record keystrokes, passwords, private form inputs, or payment information.

Do not enable full session replay by default.

Design a modular integration point for optional heatmap analytics.

If heatmaps are implemented internally:

- Record only approved interaction coordinates.
- Avoid capturing input contents.
- Avoid capturing sensitive pages.
- Apply consent requirements.
- Provide configurable exclusions.
- Provide retention controls.

---

# PHASE 8 — MARKETING CENTER

Route:

/admin/marketing

Implement:

- Coupon management.
- Promotional campaigns.
- Scheduled discounts.
- Banner campaigns.
- Abandoned cart management.
- Newsletter subscribers.
- Campaign performance.
- UTM tracking.
- Customer segments.

Implement an extensible notification system.

Support provider adapters for:

- SMS.
- Email.

Do not send promotional messages without appropriate customer consent.

Provide unsubscribe and notification preference controls.

Do not send real messages through mock providers in production.

---

# PHASE 9 — REPORTING CENTER

Route:

/admin/reports

Implement:

- Sales reports.
- Revenue reports.
- Product performance.
- Category performance.
- Inventory reports.
- Customer reports.
- Campaign reports.
- Refund reports.
- Shipping reports.
- Customer retention reports.

Features:

- Date filtering.
- Comparison periods.
- Grouping.
- Sorting.
- CSV export.
- Excel export.
- Printable reports.

All reports must use real database records.

Document financial calculations and time zone conventions.

---

# PHASE 10 — SYSTEM SETTINGS & CONTROL

Route:

/admin/settings

Implement centralized settings for:

- Store identity.
- Logo.
- Contact details.
- Currency.
- Time zone.
- Localization.
- Payment providers.
- Shipping providers.
- SMS providers.
- Email providers.
- SEO defaults.
- Homepage configuration.
- Notification preferences.
- Analytics settings.
- Privacy settings.
- Media storage.
- Backup configuration.

Create integration adapters.

Never expose secret integration credentials to frontend code.

Use secure secret storage.

Provide masked credential display.

Do not allow ordinary administrators to read sensitive secrets.

---

# PHASE 11 — RBAC & ADMIN SECURITY

Implement granular Role-Based Access Control.

Initial roles:

- SUPER_ADMIN
- ADMIN
- PRODUCT_MANAGER
- ORDER_MANAGER
- CONTENT_MANAGER
- MARKETING_MANAGER
- ANALYST
- SUPPORT_AGENT

Create permissions such as:

- dashboard.view
- products.view
- products.create
- products.update
- products.delete
- inventory.manage
- orders.view
- orders.update
- customers.view
- customers.export
- cms.manage
- analytics.view
- analytics.export
- marketing.manage
- reports.view
- settings.manage
- users.manage
- audit.view

Requirements:

- Permission checks on the server.
- Role assignment.
- Custom roles.
- Permission management.
- Admin session management.
- Audit logging.
- Sensitive operation confirmation.

A hidden UI element is not an authorization mechanism.

Every server action and API endpoint must enforce permissions independently.

SUPER_ADMIN must be the only role with unrestricted administrative privileges by default.

Prevent privilege escalation.

Record administrative changes with:

- Actor.
- Action.
- Resource type.
- Resource ID.
- Timestamp.
- Safe before/after snapshots where appropriate.
- Request correlation ID.

Never record credentials or sensitive payment information in audit logs.

---

# PHASE 12 — SYSTEM HEALTH & MONITORING

Create:

/admin/system

Monitor:

- Application status.
- Database connectivity.
- Database latency.
- Error rate.
- Failed payment callbacks.
- Failed background jobs.
- Storage usage.
- Recent application errors.
- Security events.
- Dependency warnings.

Provide health checks without exposing infrastructure secrets.

Implement structured logging.

Add backup status visibility.

Do not expose raw server logs to unauthorized roles.

---

# PHASE 13 — TESTING & QUALITY ASSURANCE

Write tests for:

- Dashboard authorization.
- Role and permission enforcement.
- Product management.
- Bulk actions.
- CMS publication.
- Homepage section configuration.
- Analytics event ingestion.
- Event deduplication.
- Funnel aggregation.
- Date filtering.
- Customer segmentation.
- CSV/Excel export.
- Settings access control.
- Audit logging.
- Privacy controls.

Test that customers cannot access administrative routes.

Test that unauthorized staff cannot perform restricted actions.

Test that analytics does not collect prohibited sensitive information.

Test dashboard performance with realistic data volumes.

---

# PHASE 14 — PERFORMANCE & MAINTAINABILITY

Requirements:

- Server-side pagination.
- Database indexes.
- Efficient aggregation.
- Avoid N+1 queries.
- Lazy-load heavy analytics modules.
- Cache safe aggregate data.
- Invalidate caches after relevant mutations.
- Background processing for expensive reports.
- Proper error boundaries.
- Responsive charts.
- Reusable services.
- Modular architecture.

Do not cache personalized or sensitive information publicly.

Keep the analytics module isolated from the core checkout process.

Analytics failures must never prevent customers from purchasing products.

---

# PHASE 15 — EXECUTION MANAGEMENT

Before implementation:

1. Inspect the existing repository.
2. Review the current database schema.
3. Identify reusable modules.
4. Identify missing models.
5. Identify security requirements.
6. Prepare an implementation checklist.

Maintain:

docs/ADMIN_DASHBOARD_PLAN.md
docs/ANALYTICS_ARCHITECTURE.md
docs/ADMIN_SECURITY.md
docs/ADMIN_PROGRESS.md

Implement incrementally.

Recommended implementation order:

1. Admin foundation.
2. RBAC.
3. Central dashboard.
4. Product and inventory administration.
5. Order administration.
6. CMS.
7. CRM.
8. Analytics event collection.
9. Analytics dashboards.
10. Marketing.
11. Reporting.
12. Settings and monitoring.
13. Testing and optimization.

For each module:

- Implement actual functionality.
- Integrate with the real database.
- Validate server-side authorization.
- Add tests.
- Run TypeScript checks.
- Run production build checks.
- Update progress documentation.

Do not build static demonstration dashboards.

Do not use hardcoded analytics values.

Do not mark unfinished features as complete.

Do not rewrite the existing customer-facing storefront unless required for integration.

Do not stop after producing documentation or a plan.

Continue implementation until all feasible tasks are completed.

If credentials or external providers are unavailable, implement the integration interface and clearly document the remaining setup requirements.

---

# FINAL DEFINITION OF DONE

The Control Center must allow an authorized administrator to manage the store without editing source code for ordinary business and content operations.

The administrator must be able to:

- Manage products.
- Manage sizes and colors.
- Manage stock.
- Manage orders.
- Manage customers.
- Manage discounts.
- Edit homepage sections.
- Manage banners.
- Create and edit pages.
- Manage navigation.
- Review customer behavior.
- Analyze conversion funnels.
- Analyze product performance.
- Review marketing campaigns.
- Export reports.
- Manage administrative permissions.
- Inspect audit logs.
- Manage supported system settings.

All displayed metrics must originate from real data.

All sensitive operations must be protected by server-side authorization.

All customer analytics must follow privacy and data minimization principles.

The dashboard must be production-oriented, responsive, maintainable, and extensible.

START BY AUDITING THE EXISTING PROJECT AND THEN IMPLEMENT THE CONTROL CENTER IN PRIORITY ORDER.

یک توصیه معماری مهم: جمع‌آوری رویدادهای Analytics را از همان نسخه اول فعال کن، حتی اگر داشبورد تحلیلی پیشرفته را بعداً بسازی. چون داده‌های رفتاری از زمان راه‌اندازی جمع می‌شوند و نمی‌توانی رفتار کاربران ماه‌های گذشته را به‌صورت واقعی بازسازی کنی.
