# MASTER EXECUTION PROMPT

# ILKAII — Production-Ready Fashion E-commerce MVP

## 1. ROLE & MISSION

You are acting as a Senior Full-Stack Software Architect, Senior Next.js Engineer, Database Architect, E-commerce Product Engineer, UI/UX Engineer, and Application Security Engineer.

Your mission is to inspect, architect, implement, test, and prepare the existing **ilkaii** project for its first production-capable MVP release.

Project: ilkaii  
Business: Premium women's and sportswear online store  
Primary market: Iran  
Primary language: Persian (fa-IR)  
Interface direction: RTL  
Currency: Iranian Toman  
Primary objective: Build a secure, responsive, high-performance fashion e-commerce platform.

IMPORTANT:

You must work directly with the existing repository.

Do not merely provide recommendations, architecture documents, or code examples.

You must implement the actual features, modify existing files, create missing files, update the database schema, execute tests, and fix implementation errors.

Work incrementally and maintain a functional application throughout development.

---

# 2. EXISTING PROJECT BASELINE

The project README describes the following stack:

- Next.js 15
- React 19
- TypeScript
- App Router
- Tailwind CSS 3
- MySQL 8
- Prisma 5
- Zustand
- OTP-based authentication
- Next.js Server Components
- Mobile-first responsive design

Existing documented structure:

src/app/
src/components/
src/lib/
src/store/
src/types/
src/styles/

prisma/schema.prisma

Existing documented components:

- Navbar
- MobileDrawer
- Hero
- FeaturedCategories

Existing documented data models:

- User
- Product
- ProductVariant
- ProductImage
- Category
- Order
- CartItem
- WishlistItem
- Review
- Address

First, inspect the ACTUAL repository, including:

- package.json
- package-lock.json
- README.md
- prisma/schema.prisma
- all existing application routes
- all existing components
- server actions and API routes
- authentication implementation
- database utilities
- environment configuration
- existing tests

The README is a project description, not proof that its described functionality is implemented.

Do not assume any feature already works without inspecting its implementation.

Do not replace the existing architecture unnecessarily.

Preserve working functionality and improve the current codebase.

---

# 3. DEVELOPMENT RULES

Follow these rules throughout the project:

1. TypeScript strict mode must remain enabled.
2. Prefer Server Components by default.
3. Use Client Components only where interactivity requires them.
4. Never expose secrets or sensitive business logic to the browser.
5. Validate all external input on the server.
6. Use Zod for request and form validation.
7. Use Prisma for database operations.
8. Use database transactions for critical operations.
9. Implement reusable components and services.
10. Avoid duplicated business logic.
11. Follow consistent naming conventions.
12. Use proper loading, empty, success, and error states.
13. Do not leave fake buttons or nonfunctional UI elements.
14. Do not use hardcoded mock data in production functionality.
15. Do not silently swallow errors.
16. Never disable security controls to make tests pass.
17. Avoid unnecessary dependencies.
18. Document important architectural decisions.
19. Maintain backward compatibility with existing data whenever possible.
20. Do not claim a task is complete without verification.

Before changing dependencies, inspect the installed versions and compatibility.

Check Node.js requirements and the compatibility of Next.js, React, Prisma, and their adapters.

If an existing dependency has a known security issue, evaluate and resolve it without blindly upgrading the entire stack.

---

# 4. DESIGN SYSTEM & BRAND EXPERIENCE

Build a premium, modern, minimalist fashion e-commerce experience.

The interface must feel like a professional international fashion brand rather than a generic online shop.

Preserve the documented luxury palette:

Primary: #6B5E57
Secondary: #A89C94
Background: #F5F1ED
Text: #2B2B2B
Border: #E8E3DE
Hover: #5A4D46

Typography:

- Persian-friendly typography with proper RTL rendering.
- Playfair Display may be retained for Latin headings.
- Use a suitable Persian font for Persian content.
- Use consistent typography scales.

Design requirements:

- Fully responsive.
- Mobile-first.
- Desktop, tablet, and mobile layouts.
- Minimum 44px interactive touch targets.
- Proper spacing and visual hierarchy.
- High-quality product imagery.
- Subtle transitions and animations.
- Accessible contrast and keyboard navigation.
- Proper focus states.
- Consistent skeleton loaders.
- No layout shifts during image loading.
- Professional empty states.

Use Next.js Image optimization.

Do not rely on temporary Unsplash URLs as permanent production product assets.

Create a reusable design system and consistent component patterns.

---

# 5. EXECUTION PHASES

Execute the following phases in order.

Do not skip a phase.

## PHASE 0 — REPOSITORY AUDIT

Tasks:

- Inspect the complete project structure.
- Inspect the current database schema.
- Identify implemented and missing features.
- Identify duplicated or unnecessary code.
- Inspect dependency versions.
- Inspect authentication and authorization.
- Inspect existing security controls.
- Inspect responsive behavior.
- Identify build errors and TypeScript errors.
- Identify architectural risks.

Deliver:

docs/PROJECT_AUDIT.md

Include:

- Existing architecture.
- Existing functionality.
- Missing functionality.
- Security weaknesses.
- Database weaknesses.
- Technical debt.
- Implementation priorities.

Create:

docs/IMPLEMENTATION_PLAN.md

List all tasks with their priority, dependencies, and acceptance criteria.

After the audit, immediately begin implementation.

Do not wait for user approval for ordinary technical decisions.

If an external credential, payment provider, SMS provider, or other unavailable third-party integration is required, implement the appropriate abstraction and report the exact missing configuration.

## PHASE 1 — DATABASE & DOMAIN ARCHITECTURE

Review and improve prisma/schema.prisma.

Implement or complete these entities:

### Identity

- User
- Address
- Role
- Permission
- UserRole
- Session
- OtpChallenge

### Catalog

- Category
- Brand
- Product
- ProductImage
- ProductVariant
- SizeGuide

### Shopping

- Cart
- CartItem
- WishlistItem

### Orders

- Order
- OrderItem
- Payment
- Shipment
- OrderStatusHistory

### Inventory

- InventoryMovement

### Promotions

- Coupon

### Customer Experience

- Review
- ReturnRequest

### Security and Auditing

- AuditLog

Database requirements:

1. Use appropriate foreign keys.
2. Add indexes for frequent queries.
3. Add unique constraints for SKU and other unique identifiers.
4. Use appropriate decimal types for monetary values.
5. Avoid floating-point money calculations.
6. Store monetary values consistently in Toman.
7. Define appropriate enums for statuses.
8. Implement timestamps.
9. Preserve historical order data.
10. Use soft deletion where appropriate.
11. Prevent orphaned records.
12. Use transactions for inventory and order operations.

Do not blindly replace the existing schema.

Generate a migration strategy that preserves existing data.

Use Prisma migrations for production schema evolution.

Do not rely on db:push as the production migration strategy.

## PHASE 2 — AUTHENTICATION & AUTHORIZATION

Implement secure phone-number-based authentication.

Requirements:

- Iranian mobile number validation.
- OTP generation.
- OTP expiration.
- OTP hashing.
- Rate limiting.
- Maximum verification attempts.
- Resend cooldown.
- Generic responses that do not reveal account existence.
- Secure session management.
- Secure logout.
- Session expiration.
- Session revocation.
- Server-side authorization.

Security requirements:

- HttpOnly cookies.
- Secure cookies in production.
- Appropriate SameSite policy.
- CSRF protection where applicable.
- Session rotation after authentication.
- Never store authentication tokens in localStorage.
- Never expose OTP values to frontend production responses.
- Never log OTPs or session secrets.

Implement RBAC.

Initial roles:

- SUPER_ADMIN
- ADMIN
- ORDER_MANAGER
- PRODUCT_MANAGER
- CUSTOMER

Create a secure initial administrator bootstrap procedure.

Never create a publicly accessible admin registration endpoint.

Never hardcode administrator credentials.

SMS provider must be configurable through a server-side adapter.

If credentials are unavailable, implement a development-only OTP provider that cannot accidentally operate in production.

## PHASE 3 — PRODUCT CATALOG

Implement a complete fashion product management system.

Product fields should support:

- Name
- Slug
- SKU
- Description
- Short description
- Category
- Brand
- Price
- Sale price
- Product status
- Featured status
- New arrival status
- Material
- Fabric composition
- Care instructions
- Season
- Gender/category classification
- SEO title
- SEO description

Product variants must support:

- Size
- Color
- SKU
- Price override if necessary
- Stock quantity
- Low-stock threshold
- Availability
- Variant-specific images

Important:

Inventory must be maintained per individual variant.

Example:

Product: Women's Oversized Hoodie

Black / S: 5 units
Black / M: 3 units
Black / L: 0 units

White / S: 2 units
White / M: 0 units
White / L: 4 units

The customer must only be able to purchase available variants.

Implement:

- Multiple product images.
- Image ordering.
- Main product image.
- Product image gallery.
- Color-specific images.
- Product filtering.
- Product sorting.
- Product search.
- Pagination.
- Related products.
- New arrivals.
- Best sellers.
- Featured products.

Implement an image upload service with:

- File type validation.
- Actual MIME validation.
- File size limits.
- Safe filenames.
- Image processing.
- Image dimensions validation.
- Storage abstraction.

Never trust a filename or client-supplied MIME type.

## PHASE 4 — STORE FRONTEND

Implement these pages:

1. Home page
2. Shop page
3. Category page
4. Product details page
5. Search results page
6. Cart page
7. Checkout page
8. Login and verification pages
9. Customer account page
10. Customer order history
11. Order details page
12. Wishlist page
13. Size guide page
14. About page
15. Contact page
16. Shipping and return policy pages
17. Privacy policy page
18. Terms and conditions page

Homepage sections:

- Hero banner
- Main categories
- Featured products
- New arrivals
- Best sellers
- Promotional banner
- Seasonal collection
- Trust indicators
- Newsletter or marketing subscription (optional)
- Footer

Product listing requirements:

- Search.
- Category filtering.
- Size filtering.
- Color filtering.
- Price range.
- Availability filtering.
- Sorting.
- Pagination.
- Responsive product grid.

Product detail requirements:

- Image gallery.
- Product title.
- Price.
- Discount.
- Variant selection.
- Available sizes.
- Available colors.
- Size guide.
- Stock status.
- Quantity selector.
- Add to cart.
- Wishlist.
- Description.
- Fabric details.
- Care instructions.
- Related products.

Variant selection must update availability and images correctly.

Do not allow adding an unavailable variant to the cart.

## PHASE 5 — SHOPPING CART

Implement persistent shopping cart functionality.

Requirements:

- Add item.
- Remove item.
- Update quantity.
- Update variant.
- Display subtotal.
- Display discounts.
- Display shipping estimate.
- Display final total.
- Preserve cart between page visits.
- Merge guest cart with authenticated customer cart when appropriate.

Important:

The backend must always calculate the authoritative price.

Never trust client-submitted prices, discounts, totals, or stock quantities.

Validate all cart items against the current database state.

Revalidate inventory before checkout.

Prevent quantity manipulation and invalid variant combinations.

## PHASE 6 — CHECKOUT & ORDER MANAGEMENT

Implement a complete checkout process.

Steps:

1. Validate customer information.
2. Select or create delivery address.
3. Validate postal code and phone.
4. Select shipping method.
5. Calculate shipping cost.
6. Apply coupon if valid.
7. Recalculate all prices on the server.
8. Verify inventory.
9. Create a pending order.
10. Initiate payment.
11. Verify payment through the payment provider.
12. Finalize order.
13. Update inventory transactionally.
14. Generate order tracking code.

Order statuses:

- PENDING_PAYMENT
- PAID
- PROCESSING
- PACKED
- SHIPPED
- DELIVERED
- CANCELLED
- REFUNDED

Payment statuses must be modeled separately from order statuses.

Implement payment provider abstraction.

Do not assume a particular payment provider.

The provider must be configurable.

Payment verification must happen server-side.

Implement idempotent payment callbacks.

Never mark an order as paid based only on a frontend redirect.

Prevent duplicate orders and duplicate inventory deductions.

Handle:

- Failed payment.
- Cancelled payment.
- Duplicate callback.
- Expired payment.
- Inventory changes during checkout.

If real payment credentials are unavailable, implement a mock payment adapter exclusively for local development and testing.

Never enable mock payment in production.

## PHASE 7 — CUSTOMER ACCOUNT

Implement:

- Profile management.
- Address management.
- Order history.
- Order details.
- Order tracking.
- Wishlist.
- Reviews.
- Return request submission.

Enforce ownership checks for every customer-specific resource.

Customers must never access another customer's:

- Orders.
- Addresses.
- Payment details.
- Wishlist.
- Personal information.

## PHASE 8 — ADMIN DASHBOARD

Create a secure administration interface.

Admin dashboard features:

### Overview

- Total orders.
- Total revenue.
- Pending orders.
- Completed orders.
- Low-stock products.
- Recent orders.
- Sales summary.

### Product management

- Create product.
- Edit product.
- Delete or archive product.
- Manage categories.
- Manage brands.
- Upload images.
- Manage variants.
- Update stock.
- Manage prices.
- Manage discounts.

### Inventory management

- Stock adjustments.
- Stock movement history.
- Low-stock alerts.
- SKU search.
- Variant-level stock management.

### Order management

- Order listing.
- Order details.
- Payment status.
- Shipping status.
- Update order status.
- Add tracking number.
- Cancel order.
- Process return requests.

### Customer management

- Customer listing.
- Customer details.
- Order history.
- Account status.

### Promotions

- Coupon creation.
- Discount type.
- Discount amount.
- Minimum purchase amount.
- Expiration date.
- Usage limits.
- Per-user usage limits.
- Active/inactive status.

### Administration security

- Role-based permissions.
- Server-side access control.
- Audit logs.
- Secure administrative actions.
- No public admin registration.

Do not rely on hiding buttons in the frontend for authorization.

Every administrative mutation must be authorized on the server.

## PHASE 9 — IRANIAN E-COMMERCE REQUIREMENTS

Implement Persian-first behavior.

Requirements:

- RTL layout.
- Persian typography.
- Persian digit formatting in UI.
- Toman currency formatting.
- Iranian mobile number validation.
- Iranian postal code validation.
- Persian date display.
- Jalali calendar support.
- Persian search normalization.
- Support for both Persian and Arabic character variants.
- Configurable delivery costs.
- Shipping tracking number.
- SMS notification adapter.

Keep monetary calculations consistent internally.

Never mix Rial and Toman without explicit conversion.

Persist timestamps in a consistent standard and display them in Asia/Tehran time.

Create an adaptable shipping service interface.

Initial shipping methods:

- Postal delivery.
- Courier delivery.
- Store pickup (optional, configurable).

Shipping fees must be configurable through admin settings or a clearly documented configuration mechanism.

Do not hardcode a shipping provider or its API credentials.

## PHASE 10 — SECURITY HARDENING

Perform a dedicated security implementation and audit.

### Authentication security

- Secure OTP handling.
- OTP hashing.
- Rate limiting.
- Brute-force protection.
- Session expiration.
- Session revocation.
- Secure cookie configuration.

### Application security

- Input validation using Zod.
- Output encoding.
- XSS prevention.
- CSRF protection.
- SQL injection prevention.
- IDOR prevention.
- Mass assignment prevention.
- Request size limits.
- API rate limiting.
- Secure error handling.

### Upload security

- MIME verification.
- Extension validation.
- Size restrictions.
- Image decoding and re-encoding.
- Safe storage.
- No executable uploads.

### HTTP security

Configure appropriate:

- Content-Security-Policy.
- Strict-Transport-Security.
- X-Content-Type-Options.
- Referrer-Policy.
- Permissions-Policy.
- Frame protection.

Configure CORS only where necessary.

Do not use wildcard origins with credentials.

### Payment security

- Server-side payment initiation.
- Server-side verification.
- Idempotency.
- Duplicate callback prevention.
- Payment reference validation.
- Amount validation.
- Transactional order finalization.

### Data security

- Least-privilege database account.
- Secret management.
- No credentials in Git.
- No sensitive information in application logs.
- Audit logging.
- Backup strategy.
- Data retention considerations.

### Dependency security

- Run npm audit.
- Review vulnerable packages.
- Evaluate dependency updates.
- Avoid installing unnecessary packages.
- Document unresolved vulnerabilities.

Create:

docs/SECURITY_AUDIT.md

Document:

- Implemented controls.
- Security tests.
- Remaining risks.
- Production configuration requirements.

Never claim that the application is completely secure.

## PHASE 11 — SEO & PERFORMANCE

Implement:

- Dynamic page metadata.
- Canonical URLs.
- Sitemap.
- Robots.txt.
- Product structured data.
- Breadcrumb structured data.
- Open Graph metadata.
- SEO-friendly product slugs.
- Proper heading hierarchy.
- Image alt text.
- Optimized images.
- Lazy loading.
- Responsive image sizes.
- Server-side product rendering.
- Pagination.
- Efficient database queries.
- Proper caching and cache invalidation.

Ensure product pages are indexable.

Do not accidentally cache authenticated customer data or personalized responses publicly.

Optimize for Core Web Vitals.

Target:

- Good LCP.
- Low CLS.
- Responsive interactions.
- Minimal JavaScript.
- Efficient image delivery.

## PHASE 12 — TESTING

Implement automated tests.

Use an appropriate testing stack compatible with the existing project.

Required coverage:

### Unit tests

- Price calculations.
- Discount calculations.
- Coupon validation.
- Stock validation.
- Iranian phone validation.
- Postal code validation.
- Order state transitions.

### Integration tests

- Authentication.
- OTP verification.
- Product CRUD.
- Variant management.
- Cart operations.
- Checkout.
- Payment verification.
- Inventory transactions.
- Authorization.

### Security tests

- Unauthorized admin access.
- Customer accessing another customer's order.
- Invalid OTP.
- OTP brute-force attempts.
- Invalid product IDs.
- Price manipulation.
- Quantity manipulation.
- Duplicate payment callback.
- Invalid file uploads.
- Rate limiting.

### End-to-end tests

Test the complete customer journey:

1. Visit homepage.
2. Open a category.
3. Search for a product.
4. Open product details.
5. Select size and color.
6. Add product to cart.
7. Authenticate.
8. Add delivery address.
9. Checkout.
10. Complete test payment.
11. Verify order creation.
12. Verify order history.
13. Verify admin order management.

Test mobile and desktop layouts.

All critical tests must pass before declaring the MVP ready.

## PHASE 13 — PRODUCTION READINESS

Prepare the application for deployment.

Requirements:

- Production environment configuration.
- .env.example.
- Database migration instructions.
- Build verification.
- Error handling.
- Production logging.
- Database backup documentation.
- Secure admin bootstrap.
- Image storage configuration.
- SMS provider configuration.
- Payment provider configuration.
- Deployment documentation.

Deployment must support Node.js hosting and VPS environments.

Do not expose environment variables.

Never commit real credentials.

Create:

docs/DEPLOYMENT.md

---

# 6. MVP SCOPE CONTROL

The first release must prioritize a fully functional buying experience.

## MUST HAVE

- Homepage.
- Product catalog.
- Product details.
- Product variants.
- Variant-level inventory.
- Search and filtering.
- Authentication.
- Customer account.
- Shopping cart.
- Checkout.
- Payment integration abstraction.
- Order management.
- Admin dashboard.
- Product management.
- Inventory management.
- Customer order history.
- Shipping management.
- Security controls.
- SEO foundations.
- Responsive design.

## SHOULD HAVE

- Wishlist.
- Coupon system.
- Size guide.
- Reviews.
- Related products.
- Low-stock alerts.
- Order notifications.
- Return request submission.

## LATER

Do not implement these during the initial MVP unless they are already substantially implemented:

- AI recommendations.
- Loyalty points.
- Wallet.
- Affiliate marketing.
- Advanced analytics.
- Automated marketing campaigns.
- Multi-vendor marketplace.
- Advanced warehouse management.
- Complex ERP integrations.

Keep the architecture extensible for future additions.

---

# 7. EXECUTION MANAGEMENT

Use the following execution workflow.

For every phase:

1. Inspect existing implementation.
2. Identify missing functionality.
3. Create a concise task checklist.
4. Implement the functionality.
5. Run relevant tests.
6. Fix discovered problems.
7. Verify TypeScript.
8. Update documentation.
9. Mark tasks as completed only after verification.
10. Continue to the next phase.

Maintain:

docs/PROGRESS.md

Format:

# Implementation Progress

## Phase 0 — Audit

- [x] Completed task
- [ ] Pending task

## Phase 1 — Database

- [ ] Pending task

For each completed task include:

- Files created.
- Files modified.
- Implementation summary.
- Tests executed.
- Test results.
- Remaining limitations.

Do not mark incomplete functionality as complete.

If a task is blocked by missing credentials or external access, implement everything possible and document the blocker.

Do not stop after generating the implementation plan.

Do not stop after creating the database schema.

Continue implementing all phases in priority order.

If the task becomes too large for one execution session, preserve the progress document and continue from the next incomplete task without repeating completed work.

---

# 8. DEFINITION OF DONE

The MVP is considered ready only when:

- The application builds successfully.
- TypeScript checks pass.
- Critical tests pass.
- Database migrations work.
- Authentication works.
- Product and variant management works.
- Inventory is accurate.
- Cart calculations are server-authoritative.
- Checkout works.
- Payment verification is implemented.
- Duplicate payment callbacks are handled safely.
- Orders can be managed by administrators.
- Customer ownership checks are enforced.
- The interface works on mobile and desktop.
- No critical security vulnerabilities remain unresolved.
- Production environment requirements are documented.

External credentials may prevent live payment or SMS testing, but the integration must be implemented and tested with safe development adapters.

---

# 9. FINAL EXECUTION INSTRUCTIONS

Start NOW.

First inspect the repository and generate the audit and implementation plan.

Then immediately begin implementing Phase 1 and continue through the execution phases.

Do not ask unnecessary questions.

Make reasonable engineering decisions independently.

Do not redesign the entire application without a technical reason.

Do not introduce features outside the agreed MVP scope.

Prioritize correctness, security, maintainability, and a complete customer purchasing journey over decorative features.

Your goal is not to produce a demonstration.

Your goal is to deliver a genuinely functional, secure, extensible fashion e-commerce MVP for ilkaii.

At the end of each execution session, report:

1. Completed tasks.
2. Files created and modified.
3. Database changes.
4. Tests and build results.
5. Security improvements.
6. Outstanding blockers.
7. Exact next execution tasks.

BEGIN WITH PHASE 0 — REPOSITORY AUDIT AND THEN START IMPLEMENTATION.
