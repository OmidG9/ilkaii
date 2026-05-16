# Quick Start Guide

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or yarn
- MySQL 8.0+
- Git

## Installation (5 minutes)

### 1. Clone & Setup

```bash
# Clone repository
git clone <repository-url>
cd ilkaii

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### 2. Configure Environment

Edit `.env.local`:

```env
# Database (required)
DATABASE_URL="mysql://root:password@localhost:3306/ilkaii"

# Auth (required)
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# Zarinpal (required for payments)
ZARINPAL_MERCHANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
ZARINPAL_SANDBOX="true"

# Cloudinary (optional, for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"
```

### 3. Database Setup

```bash
# Run migrations
npm run db:migrate

# (Optional) Seed test data
npm run db:seed

# View database
npm run db:studio
```

### 4. Start Development

```bash
npm run dev
```

Visit http://localhost:3000

## File Structure Overview

```
src/
├── app/                    # Next.js pages & API routes
│   ├── api/               # REST API endpoints
│   │   ├── auth/          # Authentication
│   │   ├── products/      # Product listing/details
│   │   ├── cart/          # Shopping cart
│   │   ├── orders/        # Order creation/verification
│   │   ├── users/         # User profile
│   │   ├── wishlist/      # Wishlist
│   │   ├── reviews/       # Reviews
│   │   ├── admin/         # Admin endpoints
│   │   └── upload/        # Image uploads
│   ├── admin/             # Admin pages
│   ├── auth/              # Auth pages
│   └── checkout/          # Checkout flow
├── auth.ts                # NextAuth configuration
├── middleware.ts          # Request middleware
├── services/              # Business logic
├── lib/
│   ├── repositories.ts    # Database queries
│   ├── validators.ts      # Input validation (Zod)
│   ├── utils.ts           # Utilities
│   ├── rate-limit.ts      # Rate limiting
│   ├── jwt.ts             # JWT tokens
│   ├── prisma.ts          # Prisma client
│   └── cloudinary.ts      # Cloudinary config
├── types/                 # TypeScript types
├── components/            # React components
└── store/                 # Zustand stores
```

## Key Concepts

### Authentication Flow

1. **User requests OTP** → `/api/auth/login`
2. **Receive OTP via SMS** (dev: check console)
3. **Verify OTP** → `/api/auth/verify`
4. **Get JWT token** for subsequent requests
5. **Make authenticated requests** with token in Authorization header

### Order & Payment Flow

1. **Create Order** → `/api/orders/create`
   - Validates stock
   - Reserves inventory
   - Creates Zarinpal payment request
2. **User redirected to Zarinpal** for payment
3. **Payment verification** → `/api/orders/verify`
   - Confirms payment with Zarinpal
   - Updates inventory
   - Clears cart

### Database Structure

Key relationships:

- User → Orders, Addresses, CartItems, Reviews
- Product → Variants, Images, Orders, Reviews, CartItems
- Order → OrderItems, Payment
- Category → Products (hierarchical)

## Common Development Tasks

### Add New Product

```bash
# Using Prisma Studio
npm run db:studio
# Or via API
curl -X POST http://localhost:3000/api/admin/products \
  -H "x-user-role: ADMIN" \
  -H "x-user-id: <admin-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Awesome Product",
    "slug": "awesome-product",
    "categoryId": "...",
    "basePrice": 9999,
    "sku": "SKU-001",
    "totalStock": 100
  }'
```

### Test Payment Flow

1. Create order via `/api/orders/create`
2. Copy `payment.paymentUrl` and visit in browser
3. On Zarinpal page, payment will auto-verify (sandbox mode)
4. Should redirect to success page

### Upload Product Image

```bash
curl -X POST http://localhost:3000/api/upload \
  -H "x-user-role: ADMIN" \
  -H "x-user-id: <admin-id>" \
  -F "file=@/path/to/image.jpg"
```

## Debugging

### Check Logs

- **Server logs**: Terminal where `npm run dev` is running
- **Database logs**: Check MySQL logs
- **API errors**: Check browser console & Network tab

### Common Issues

**"Database connection failed"**

- Ensure MySQL is running: `mysql -u root -p`
- Check DATABASE_URL format
- Verify credentials

**"Rate limit exceeded"**

- Wait 1-15 minutes depending on endpoint
- Check rate limits in `/lib/rate-limit.ts`

**"Product not found"**

- Verify product exists in database
- Check slug/ID is correct
- Ensure product status is "ACTIVE"

**"Insufficient stock"**

- Check available stock in database
- Ensure quantity <= availableStock
- Review order creation logic

## Testing Checklist

- [ ] User can sign up with phone/OTP
- [ ] User can add products to cart
- [ ] User can create order
- [ ] Payment flow completes (sandbox)
- [ ] Admin can create/edit products
- [ ] Admin can manage orders
- [ ] Images upload correctly
- [ ] Search and filters work

## Production Deployment

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for:

- Environment setup
- Database migrations
- Security configuration
- Deployment checklist

## Next Steps

1. ✅ Start dev server
2. ✅ Test authentication flow
3. ✅ Test product listing
4. ✅ Test cart & orders
5. ✅ Test payment (sandbox)
6. ✅ Test admin panel
7. → Customize UI/branding
8. → Deploy to production

## API Documentation

Full API docs available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Support

For issues:

1. Check the IMPLEMENTATION_GUIDE.md
2. Review error logs
3. Check database with `npm run db:studio`
4. Verify environment variables

---

**Happy coding!** 🚀
