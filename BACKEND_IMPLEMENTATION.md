# E-commerce Backend Implementation Guide

## Overview

Complete production-grade backend for a Next.js 15 e-commerce platform with real payment processing, inventory management, and admin capabilities.

## Architecture

### Directory Structure

```
src/
├── app/api/
│   ├── admin/              # Admin management APIs
│   ├── cart/               # Shopping cart operations
│   ├── categories/         # Category management
│   ├── orders/             # Order creation and verification
│   ├── products/           # Product listing and details
│   ├── reviews/            # Product reviews
│   ├── upload/             # Image upload
│   ├── users/              # User profiles and addresses
│   └── wishlists/          # Wishlist management
├── actions/                # Server actions
├── lib/
│   ├── repositories.ts     # Data access layer
│   ├── validators.ts       # Zod schemas
│   ├── utils.ts            # Helpers
│   └── rate-limit.ts       # Rate limiting
├── services/               # Business logic
└── types/                  # TypeScript types
```

## API Endpoints

### Products

- `GET /api/products` - List products with filtering, pagination, search
- `GET /api/products/[slug]` - Get product details with variants, images, reviews

### Categories

- `GET /api/categories` - List all active categories

### Shopping Cart

- `GET /api/cart` - Get cart summary
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/remove` - Remove item from cart
- `PATCH /api/cart/update` - Update item quantity

### Orders

- `POST /api/orders/create` - Create new order with stock reservation
- `GET /api/orders/verify` - Verify payment with Zarinpal
- `GET /api/users/orders` - List user's orders

### User Management

- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `GET /api/users/addresses` - List addresses
- `POST /api/users/addresses` - Create address
- `PUT /api/users/addresses/[id]` - Update address
- `DELETE /api/users/addresses/[id]` - Delete address

### Wishlist

- `GET /api/wishlists` - Get wishlist items
- `POST /api/wishlists` - Add to wishlist
- `DELETE /api/wishlists?productId=[id]` - Remove from wishlist

### Admin Endpoints

#### Products

- `POST /api/admin/products-manage` - Create product
- `GET /api/admin/products-manage` - List products
- `GET /api/admin/products-manage/[id]` - Get product
- `PUT /api/admin/products-manage/[id]` - Update product
- `DELETE /api/admin/products-manage/[id]` - Delete product (soft)

#### Product Images

- `POST /api/admin/product-images` - Add image
- `GET /api/admin/product-images` - List product images
- `PATCH /api/admin/product-images/[id]` - Update image
- `DELETE /api/admin/product-images/[id]` - Delete image

#### Product Variants

- `POST /api/admin/product-variants` - Create variant
- `GET /api/admin/product-variants` - List variants
- `PUT /api/admin/product-variants/[id]` - Update variant
- `DELETE /api/admin/product-variants/[id]` - Delete variant

#### Categories

- `POST /api/admin/categories-manage` - Create category
- `GET /api/admin/categories-manage` - List categories
- `GET /api/admin/categories-manage/[id]` - Get category
- `PUT /api/admin/categories-manage/[id]` - Update category
- `DELETE /api/admin/categories-manage/[id]` - Delete category

#### Orders

- `GET /api/admin/orders-list` - List all orders
- `GET /api/admin/orders-detail/[id]` - Get order details
- `PATCH /api/admin/orders-detail/[id]` - Update order status

#### Users

- `GET /api/admin/users-list` - List all users

## Key Features

### 1. Product Management

- **Pagination & Filtering**: Page, size, search, category, price range
- **Sorting**: By price, newest, popular, rating
- **Stock Tracking**: Available, reserved, and total stock counts
- **Variants**: Sizes, colors with SKU tracking
- **Images**: Multiple images per product with ordering

### 2. Order Processing

- **Stock Reservation**: Atomic stock updates with Prisma transactions
- **Race Condition Handling**: Prevents overselling with database constraints
- **Transaction Integrity**: All-or-nothing order creation
- **Stock Release**: Automatic stock release on payment failure

### 3. Payment Integration

- **Zarinpal Gateway**: Complete integration with callback handling
- **Payment Verification**: Authority-based verification
- **Payment Status Tracking**: PENDING → COMPLETED/FAILED states
- **Callback Support**: GET endpoint for Zarinpal redirects

### 4. Cart Management

- **Persistent Storage**: Database-backed cart using Prisma
- **Quantity Management**: Add, update, remove operations
- **Stock Validation**: Prevents adding more than available
- **Cart Summary**: Automatic total calculations

### 5. Authentication

- **Auth.js Integration**: NextAuth with JWT sessions
- **Role-Based Access**: ADMIN, CUSTOMER, VENDOR roles
- **Protected Routes**: Automatic authorization checks
- **Session Management**: 30-day sessions with 24-hour refresh

### 6. Admin Dashboard

- **Product CRUD**: Complete management interface
- **Inventory Tracking**: Real-time stock updates
- **Order Management**: Status updates and tracking
- **User Management**: View all users
- **Image Management**: Upload and organize product images

### 7. Security

- **Input Validation**: Zod schema validation on all inputs
- **Rate Limiting**: Configurable rate limiters
- **CSRF Protection**: Built-in Next.js protection
- **SQL Injection Prevention**: Prisma parameterized queries
- **Server Actions**: Secure server-side operations

### 8. Image Upload

- **Cloudinary Integration**: Automatic optimization
- **Fallback**: Placeholder URLs when disabled
- **Metadata**: Alt text and display ordering
- **Primary Image**: Marked for product thumbnails

## Database Design

### Core Models

1. **User** - Authentication and profile management
2. **Product** - Product catalog with stock tracking
3. **ProductVariant** - Size/color combinations
4. **ProductImage** - Product photography
5. **Category** - Hierarchical categories
6. **Order** - Order management and tracking
7. **OrderItem** - Line items in orders
8. **CartItem** - Shopping cart persistence
9. **Payment** - Payment tracking (Zarinpal)
10. **Review** - Product reviews and ratings
11. **WishlistItem** - Favorites list
12. **Address** - Shipping addresses

### Key Relationships

- Products → ProductVariants (one-to-many)
- Products → ProductImages (one-to-many)
- Products → Category (many-to-one)
- Orders → OrderItems → Products (hierarchy)
- Users → Orders, Addresses, CartItems, Reviews

## Stock Management

### Stock States

```
totalStock = confirmed_sold + reserved
availableStock = totalStock - reservedStock
```

### Stock Flow

1. **Add to Cart**: No stock change
2. **Create Order**: `availableStock -= qty, reservedStock += qty`
3. **Payment Success**: `totalStock -= qty, reservedStock -= qty`
4. **Payment Failed**: `availableStock += qty, reservedStock -= qty`

### Preventing Overselling

- Atomic transactions with Prisma
- Database-level unique constraints
- Real-time availability checks
- Race condition handling with optimistic locking

## Validation

### Zod Schemas

- **productQuerySchema** - Product filtering and pagination
- **createProductSchema** - Product creation validation
- **addToCartSchema** - Cart item validation
- **createOrderSchema** - Order creation
- **createAddressSchema** - Shipping address
- **createReviewSchema** - Product reviews
- **envSchema** - Environment variables

## Error Handling

### API Error Codes

- **400** - Bad Request (validation failures)
- **401** - Unauthorized (authentication required)
- **403** - Forbidden (authorization required)
- **404** - Not Found (resource doesn't exist)
- **500** - Internal Server Error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Success Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

## Server Actions

### Admin Actions

```typescript
getAdminDashboardStats(); // Dashboard metrics
updateInventory(); // Adjust stock
exportOrdersAsCSV(); // Export data
```

### Cart Actions

```typescript
addToCartAction(); // Add item
removeFromCartAction(); // Remove item
updateCartAction(); // Update quantity
getCartSummaryAction(); // Get totals
clearCartAction(); // Clear cart
```

## Configuration

### Environment Variables

```env
DATABASE_URL=mysql://user:password@host/db
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
ZARINPAL_MERCHANT_ID=your-merchant-id
ZARINPAL_SANDBOX=true  # false for production
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Pricing Configuration

- Default tax rate: 9% (configurable)
- Shipping: Configurable per order
- Currency: USD (with Toman conversion for Zarinpal)

## Best Practices

### API Usage

1. Always authenticate before cart/order operations
2. Validate stock before creating orders
3. Handle payment callbacks properly
4. Use pagination for list endpoints
5. Implement rate limiting on public endpoints

### Security

1. Never trust frontend prices - recalculate server-side
2. Use Prisma transactions for multi-step operations
3. Validate all user input with Zod
4. Check authorization for admin operations
5. Log all payment operations

### Performance

1. Use database indexes on frequently queried fields
2. Implement pagination limits (max 100 items per page)
3. Cache category listings
4. Use include selectively in queries
5. Monitor slow queries

## Testing

### Test Scenarios

1. **Products**: Listing, filtering, searching
2. **Cart**: Add, update, remove, calculations
3. **Orders**: Creation, stock reservation, failure handling
4. **Payments**: Verification, callbacks, retry logic
5. **Admin**: CRUD operations, role verification

### Load Testing

1. Concurrent order creation
2. High product listing traffic
3. Simultaneous payment callbacks
4. Inventory updates under load

## Deployment

### Production Checklist

- [ ] Set `ZARINPAL_SANDBOX=false`
- [ ] Configure production database URL
- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure Cloudinary credentials
- [ ] Enable rate limiting
- [ ] Setup logging and monitoring
- [ ] Configure backups
- [ ] Test payment flow end-to-end

### Database

- MySQL 8.0+ or compatible
- Automatic migrations with Prisma
- Indexes on critical fields
- Regular backups recommended

## Monitoring

### Key Metrics

- Order success rate
- Payment verification time
- Stock accuracy
- Cart abandonment rate
- API response times
- Error rates by endpoint

### Logging

- All API requests and responses
- Payment verification attempts
- Database transaction failures
- Admin actions

## Future Enhancements

1. **Analytics Dashboard** - Sales trends, customer insights
2. **Discount System** - Coupons and bulk discounts
3. **Email Notifications** - Order updates, receipts
4. **Wishlist Sharing** - Social features
5. **Product Recommendations** - AI-based suggestions
6. **Multi-currency Support** - International payments
7. **Inventory Forecasting** - AI predictions
8. **Advanced Analytics** - Customer behavior analysis
