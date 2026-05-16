# 🛒 ilkaii E-commerce API Documentation

Complete production-ready API for luxury stock clothing e-commerce platform.

## 🚀 Quick Start

### Setup

```bash
npm install
npm run db:push
npm run dev
```

### Headers Required

All authenticated endpoints require:

```
x-user-id: <user-id>
x-user-role: CUSTOMER | ADMIN
```

---

## 📦 PRODUCTS API

### GET /api/products

**List all active products with pagination and filtering**

Query Parameters:

- `page` (int, default: 1) - Page number
- `pageSize` (int, default: 20, max: 100) - Items per page
- `search` (string) - Search by name/description/SKU
- `categoryId` (string) - Filter by category ID
- `categorySlug` (string) - Filter by category slug
- `minPrice` (number) - Filter by min price
- `maxPrice` (number) - Filter by max price
- `sortBy` (enum) - price-asc, price-desc, newest, popular, rating

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [...],
    "total": 456,
    "page": 1,
    "pageSize": 20,
    "totalPages": 23,
    "hasMore": true
  }
}
```

### GET /api/products/[slug]

**Get single product by slug or ID**

Returns full product with:

- All images
- Variants (sizes, colors)
- Stock information
- Reviews (last 10)
- Category details

---

## 🛍️ CART API

### GET /api/cart

**Get cart summary**

Returns:

- Cart items with product details
- Item count
- Subtotal, tax, shipping, total

### POST /api/cart/add

**Add item to cart**

Request:

```json
{
  "productId": "...",
  "variantId": "...", // Optional
  "quantity": 1
}
```

### POST /api/cart/remove

**Remove item from cart**

Request:

```json
{
  "cartItemId": "..."
}
```

### PATCH /api/cart/update

**Update cart item quantity**

Query: `?cartItemId=...`

Request:

```json
{
  "quantity": 2
}
```

---

## 📋 ORDERS API

### POST /api/orders/create

**Create new order**

Request:

```json
{
  "items": [
    {
      "productId": "...",
      "variantId": "...", // Optional
      "quantity": 1
    }
  ],
  "deliveryAddressId": "...",
  "paymentMethod": "ZARINPAL",
  "discountCode": "..." // Optional
}
```

Response:

```json
{
  "success": true,
  "data": {
    "order": { ... },
    "payment": {
      "authority": "...",
      "paymentUrl": "https://..."
    }
  }
}
```

### POST /api/orders/verify

**Verify payment after Zarinpal callback**

Request:

```json
{
  "authority": "...",
  "status": "OK" // Optional
}
```

### GET /api/users/orders

**Get user's orders**

Query:

- `page` (int, default: 1)
- `pageSize` (int, default: 10)

---

## 👤 USERS API

### GET /api/users/profile

**Get user profile**

### PATCH /api/users/profile

**Update user profile**

Request:

```json
{
  "email": "...",
  "firstName": "...",
  "lastName": "...",
  "avatar": "..."
}
```

### GET /api/users/addresses

**Get user addresses**

### POST /api/users/addresses

**Add new address**

Request:

```json
{
  "label": "Home",
  "fullName": "...",
  "phone": "+98...",
  "street": "...",
  "city": "...",
  "state": "...",
  "postalCode": "...",
  "country": "...",
  "isDefault": false
}
```

### PATCH /api/users/addresses/[id]

**Update address**

### DELETE /api/users/addresses/[id]

**Delete address**

---

## 🔐 AUTHENTICATION API

### POST /api/auth/login

**Request OTP**

Request:

```json
{
  "phone": "+98..."
}
```

### POST /api/auth/verify

**Verify OTP and login**

Request:

```json
{
  "phone": "+98...",
  "otp": "123456"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "...",
    "user": { ... }
  }
}
```

---

## ⭐ REVIEWS API

### POST /api/reviews

**Submit product review**

Request:

```json
{
  "productId": "...",
  "rating": 5,
  "title": "...",
  "comment": "..."
}
```

_Note: User must have purchased the product_

---

## 📂 CATEGORIES API

### GET /api/categories

**Get all active categories**

Returns hierarchical category structure

---

## 🎛️ ADMIN API

### Admin Authentication

All admin endpoints require `x-user-role: ADMIN` header

### Products Management

- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product

### Orders Management

- `GET /api/admin/orders` - List all orders
- `GET /api/admin/orders/[id]` - Get order details
- `PATCH /api/admin/orders/[id]` - Update order status

### Users Management

- `GET /api/admin/users` - List all users

---

## ⚡ Error Handling

All errors follow standard format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Common Status Codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

---

## 🔒 Security Features

✅ Input validation (Zod)
✅ Rate limiting
✅ CSRF protection
✅ SQL injection prevention
✅ XSS protection
✅ Stock reservation in transactions
✅ Role-based access control (RBAC)
✅ User permission verification

---

## 💰 Payment Flow

1. **Create Order** → POST /api/orders/create
   - Validates products and stock
   - Reserves inventory
   - Returns payment link

2. **Redirect to Zarinpal** → Use paymentUrl

3. **Payment Verification** → GET /api/orders/verify
   - Confirms payment with Zarinpal
   - Confirms stock reservation
   - Clears cart

---

## 📊 Database Models

### User

- OTP authentication
- Multiple addresses
- Orders and reviews
- Role-based (CUSTOMER, ADMIN)

### Product

- Dynamic pricing (base + sale)
- Stock management with reservations
- Multiple images and variants
- SEO fields

### Order

- Order items with pricing snapshot
- Payment and shipping tracking
- Status workflow
- Integrated with Zarinpal

### Payment

- Zarinpal integration
- Authority and RefId tracking
- Full response logging

---

## 🎯 Key Features

✨ **Stock Management**

- Available stock tracking
- Reserved stock during checkout
- Automatic release on payment failure

✨ **Payment Integration**

- Zarinpal gateway
- Transaction verification
- Automatic order confirmation

✨ **Admin Dashboard**

- Product CRUD
- Order management
- User management
- Real-time analytics

✨ **Security**

- Rate limiting
- Input validation
- RBAC
- Secure transactions

---

## 📝 Environment Variables

```
DATABASE_URL              # MySQL connection string
NEXTAUTH_SECRET          # Auth secret (32+ chars)
ZARINPAL_MERCHANT_ID     # Zarinpal merchant ID
ZARINPAL_SANDBOX         # true for testing
CLOUDINARY_CLOUD_NAME    # Image upload
CLOUDINARY_API_KEY       # Image upload
CLOUDINARY_API_SECRET    # Image upload
```

---

## 🔧 Development

```bash
# Start development server
npm run dev

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate -- -n "migration-name"

# Open Prisma Studio
npm run db:studio

# Lint code
npm run lint

# Build for production
npm run build
```

---

## 📦 Dependencies

- Next.js 15 - React framework
- Prisma 5 - ORM
- Zod - Validation
- Zustand - State management
- TailwindCSS - Styling
- Cloudinary - Image upload
- Zarinpal - Payment gateway

---

## 🚀 Deployment

Ready for deployment on:

- Vercel (recommended for Next.js)
- Liara (Iran-based hosting)
- Docker-compatible platforms
- Traditional VPS

---

## 📞 Support

For issues or questions:

1. Check existing documentation
2. Review error messages
3. Check database logs
4. Enable debug logging

---

**Last Updated:** May 2026
**Version:** 1.0.0
**Status:** Production Ready ✅
