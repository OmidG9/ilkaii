# E-Commerce Backend Implementation Guide

## Project Overview

This is a production-ready e-commerce platform built with:

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Prisma** for database ORM
- **MySQL** for database
- **Zarinpal** for payment gateway
- **Cloudinary** for image management
- **NextAuth** for authentication
- **Zustand** for client-side state management
- **TailwindCSS** for styling

## Environment Setup

### 1. Database Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Update DATABASE_URL with your MySQL connection string
# Example: mysql://user:password@localhost:3306/ilkaii

# Run migrations
npm run db:migrate

# (Optional) Seed database
npm run db:seed
```

### 2. Environment Variables

Required variables in `.env.local`:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/ilkaii"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"

# Zarinpal Payment
ZARINPAL_MERCHANT_ID="your-merchant-id"
ZARINPAL_SANDBOX="true"  # Set to false in production

# Cloudinary (Optional, for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# SMS Service (Optional, for OTP)
# Add your SMS provider credentials here
# Example: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
```

### 3. Database Schema

The Prisma schema includes models for:

- **User** - Customer profiles with OTP authentication
- **Product** - Inventory with variants and images
- **Category** - Product categorization
- **Cart** - Shopping cart items
- **Order** - Order management and history
- **Payment** - Payment tracking and reconciliation
- **Review** - Product reviews
- **Wishlist** - User wishlists
- **Address** - Delivery addresses

## API Endpoints

### Authentication

```
POST   /api/auth/login          - Request OTP
POST   /api/auth/verify         - Verify OTP
POST   /api/auth/signout        - Sign out
```

### Products

```
GET    /api/products            - List products with filters
GET    /api/products/[slug]     - Get product details
```

### Cart

```
GET    /api/cart                - Get cart summary
POST   /api/cart/add            - Add item to cart
PATCH  /api/cart/update         - Update cart item
POST   /api/cart/remove         - Remove from cart
```

### Orders

```
POST   /api/orders/create       - Create order
POST   /api/orders/verify       - Verify payment
GET    /api/users/orders        - Get user orders
```

### User Profile

```
GET    /api/users/profile       - Get user profile
PATCH  /api/users/profile       - Update profile
GET    /api/users/addresses     - Get addresses
POST   /api/users/addresses     - Create address
PATCH  /api/users/addresses/[id] - Update address
DELETE /api/users/addresses/[id] - Delete address
```

### Reviews & Wishlist

```
POST   /api/reviews             - Create review
GET    /api/wishlist            - Get wishlist
POST   /api/wishlist            - Add to wishlist
DELETE /api/wishlist            - Remove from wishlist
```

### Admin

```
GET    /api/admin/products      - List all products
POST   /api/admin/products      - Create product
PATCH  /api/admin/products/[id] - Update product
DELETE /api/admin/products/[id] - Delete product
POST   /api/admin/products/[id]/images   - Add product images
POST   /api/admin/products/[id]/variants - Add variants

GET    /api/admin/orders        - List all orders
GET    /api/admin/orders/[id]   - Get order details
PATCH  /api/admin/orders/[id]   - Update order status

GET    /api/admin/categories    - List categories
POST   /api/admin/categories    - Create category
PATCH  /api/admin/categories/[id] - Update category
DELETE /api/admin/categories/[id] - Delete category

GET    /api/admin/analytics     - Get reports/analytics

POST   /api/upload              - Upload images
DELETE /api/upload              - Delete images
```

## Key Features

### 1. Stock Management

- **Real-time Stock Tracking**: Available, reserved, and total stock
- **Stock Reservation**: Reserved when order is created
- **Stock Confirmation**: Confirmed when payment succeeds
- **Stock Release**: Released if payment fails

### 2. Payment Processing

- **Zarinpal Integration**: Secure payment gateway
- **Transaction Handling**: Database transactions ensure consistency
- **Payment Verification**: Webhook handling for payment confirmation
- **Order Reconciliation**: Automatic stock updates on payment success/failure

### 3. Security

- **Input Validation**: Zod schemas for all inputs
- **Rate Limiting**: Per-endpoint rate limiting
- **Authentication**: NextAuth with JWT/Session support
- **Authorization**: Role-based access control (ADMIN, CUSTOMER)
- **HTTPS**: Required for production

### 4. Performance

- **Database Indexing**: Optimized queries with proper indexes
- **Pagination**: All list endpoints support pagination
- **Caching**: Implement Redis for session/cache (optional)
- **Image Optimization**: Cloudinary for automatic optimization

## Deployment Checklist

### Pre-Deployment

- [ ] Update environment variables to production values
- [ ] Set `NEXTAUTH_SECRET` to a strong random string (32+ chars)
- [ ] Set `NEXTAUTH_URL` to your production domain
- [ ] Set `ZARINPAL_SANDBOX=false` for live payments
- [ ] Configure Cloudinary with production account
- [ ] Set up SMS service for OTP delivery
- [ ] Review and update database backups

### Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Run all migrations
npm run db:migrate

# (Optional) Seed test data
npm run db:seed
```

### Build & Deploy

```bash
# Build project
npm run build

# Test production build locally
npm start

# Deploy to hosting (Vercel, Railway, etc.)
```

### Post-Deployment

- [ ] Test all payment flows in production
- [ ] Monitor error logs and metrics
- [ ] Set up automated backups
- [ ] Configure CDN for static assets
- [ ] Enable HTTPS and security headers
- [ ] Set up email/SMS notifications

## Testing Payment Flow

### Development (Sandbox Mode)

1. **Create Order**:

   ```bash
   POST /api/orders/create
   {
     "items": [{"productId": "...", "quantity": 1}],
     "deliveryAddressId": "...",
     "paymentMethod": "ZARINPAL"
   }
   ```

2. **Redirect to Payment**: Use returned `payment.paymentUrl`

3. **Verify Payment**:
   ```bash
   POST /api/orders/verify
   {
     "authority": "A00000000000000000000000000000123456"
   }
   ```

### Production (Live Payments)

Same flow, but with:

- Real payment amounts
- Real merchant ID
- ZARINPAL_SANDBOX=false

## Code Structure

```
src/
  ├── app/                 # Next.js app directory
  │   ├── api/            # API routes
  │   ├── admin/          # Admin pages
  │   ├── auth/           # Auth pages
  │   └── ...             # Other pages
  ├── lib/                # Utilities and helpers
  │   ├── repositories.ts # Database access layer
  │   ├── validators.ts   # Zod schemas
  │   ├── utils.ts        # Helper functions
  │   ├── prisma.ts       # Prisma client
  │   └── ...
  ├── services/           # Business logic
  │   └── index.ts        # All services
  ├── types/              # TypeScript types
  ├── store/              # Zustand stores
  ├── components/         # React components
  └── middleware.ts       # Next.js middleware
```

## Common Issues & Solutions

### Issue: "Database connection failed"

- Verify DATABASE_URL is correct
- Check MySQL server is running
- Ensure database exists

### Issue: "Rate limit exceeded"

- Wait for the rate limit window to reset
- Adjust rate limits in `/lib/rate-limit.ts`

### Issue: "Payment verification failed"

- Verify authority parameter is correct
- Check Zarinpal merchant ID
- Ensure callback URL is accessible

### Issue: "Image upload fails"

- Verify Cloudinary credentials
- Check folder permissions
- Ensure file size is under Cloudinary limits

## Performance Optimization

1. **Database**:
   - Add indexes on frequently queried columns
   - Use Prisma caching
   - Monitor slow queries

2. **API**:
   - Implement response compression
   - Use CDN for static content
   - Cache product listings

3. **Frontend**:
   - Lazy load images
   - Code splitting
   - Server-side rendering

## Security Best Practices

1. **Never** trust frontend prices - always recalculate server-side
2. **Always** validate all inputs with Zod
3. **Use** HTTPS in production
4. **Rotate** secrets regularly
5. **Monitor** for suspicious activity
6. **Implement** CSRF protection
7. **Log** all payment transactions

## Support & Maintenance

### Regular Tasks

- [ ] Monitor error logs daily
- [ ] Check database size weekly
- [ ] Review security updates weekly
- [ ] Test backup restoration monthly
- [ ] Update dependencies quarterly

### Monitoring

Set up monitoring for:

- API response times
- Error rates
- Payment success rate
- Database performance
- Server resource usage

## API Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": {
    /* response data */
  },
  "message": "Success message (optional)"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## Rate Limits

- **Auth endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per minute
- **Checkout**: 10 requests per minute

## Support

For issues or questions, refer to:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth Documentation](https://next-auth.js.org)
- [Zarinpal Documentation](https://docs.zarinpal.com)
