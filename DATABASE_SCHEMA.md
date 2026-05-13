# Database Schema Reference

Complete Prisma schema documentation for the ilkaii e-commerce platform.

## Models Overview

### 1. User Model

**OTP-based authentication system with comprehensive user management**

```prisma
model User {
  id                String    @id @default(cuid())
  phone             String    @unique
  email             String?   @unique
  firstName         String?
  lastName          String?
  avatar            String?
  otp               String?
  otpExpiry         DateTime?
  otpAttempts       Int       @default(0)
  isVerified        Boolean   @default(false)
  role              UserRole  @default(CUSTOMER)

  addresses         Address[]
  orders            Order[]
  wishlistItems     WishlistItem[]
  cartItems         CartItem[]
  reviews           Review[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLogin         DateTime?
}

enum UserRole {
  CUSTOMER
  ADMIN
  VENDOR
}
```

**Fields:**

- `id`: Unique identifier (CUID)
- `phone`: Primary login method (unique)
- `email`: Optional, for receipts/newsletter
- `otp`: OTP code (temporary)
- `otpExpiry`: When OTP expires
- `otpAttempts`: Prevent brute force (reset after verification)
- `isVerified`: Phone verification status
- `role`: CUSTOMER | ADMIN | VENDOR
- `lastLogin`: Track user activity

**Relationships:**

- One-to-many: orders, addresses, reviews
- Many-to-many: cartItems, wishlistItems

**Usage Example:**

```typescript
// Create user with OTP
const user = await prisma.user.create({
  data: {
    phone: "+1234567890",
    otp: "123456",
    otpExpiry: new Date(Date.now() + 10 * 60000), // 10 minutes
  },
});

// Verify user
const verified = await prisma.user.update({
  where: { id: userId },
  data: {
    isVerified: true,
    otp: null,
    otpExpiry: null,
  },
});
```

---

### 2. Address Model

**Shipping and billing addresses**

```prisma
model Address {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  label             String    // "Home", "Office"
  fullName          String
  phone             String
  street            String
  city              String
  state             String
  postalCode        String
  country           String
  isDefault         Boolean   @default(false)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
}
```

**Fields:**

- `label`: Address type identifier
- `isDefault`: Primary delivery address
- `fullName`: Recipient name
- `phone`: Contact number

**Usage Example:**

```typescript
// Add address
await prisma.address.create({
  data: {
    userId: "user-1",
    label: "Home",
    fullName: "Jane Doe",
    phone: "+1234567890",
    street: "123 Main St",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "USA",
    isDefault: true,
  },
});

// Get user addresses
const addresses = await prisma.address.findMany({
  where: { userId: "user-1" },
});
```

---

### 3. Category Model

**Hierarchical product categories**

```prisma
model Category {
  id                String    @id @default(cuid())
  name              String    @unique
  slug              String    @unique
  description       String?   @db.Text
  image             String?
  icon              String?   // Lucide icon name
  parentId          String?
  parent            Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children          Category[] @relation("CategoryHierarchy")

  products          Product[]

  isActive          Boolean   @default(true)
  displayOrder      Int       @default(0)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([parentId])
  @@index([slug])
}
```

**Fields:**

- `slug`: URL-friendly identifier
- `icon`: Lucide icon name (e.g., "dress", "shirt")
- `parentId`: For subcategories
- `displayOrder`: Sorting priority

**Usage Example:**

```typescript
// Create parent category
const women = await prisma.category.create({
  data: {
    name: "Women",
    slug: "women",
    icon: "users-female",
    isActive: true,
    displayOrder: 1,
  },
});

// Create subcategory
const dresses = await prisma.category.create({
  data: {
    name: "Dresses",
    slug: "dresses",
    parentId: women.id,
    displayOrder: 1,
  },
});

// Get category tree
const categories = await prisma.category.findMany({
  where: { parentId: null },
  include: { children: true },
});
```

---

### 4. Product Model

**Core product inventory with stock management**

```prisma
model Product {
  id                String    @id @default(cuid())
  name              String
  slug              String    @unique
  description       String?   @db.Text
  shortDescription  String?

  categoryId        String
  category          Category  @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  basePrice         Decimal   @db.Decimal(10, 2)
  salePrice         Decimal?  @db.Decimal(10, 2)
  currency          String    @default("USD")

  sku               String    @unique
  barcode           String?   @unique
  totalStock        Int       @default(0)
  reservedStock     Int       @default(0)
  availableStock    Int       @default(0)
  reorderLevel      Int       @default(10)
  status            ProductStatus @default(ACTIVE)

  images            ProductImage[]
  heroImage         String?
  variants          ProductVariant[]
  reviews           Review[]
  averageRating     Decimal?  @db.Decimal(3, 2)
  reviewCount       Int       @default(0)
  wishlistItems     WishlistItem[]
  cartItems         CartItem[]
  orderItems        OrderItem[]

  metaTitle         String?
  metaDescription   String?

  isDeleted         Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([categoryId])
  @@index([slug])
  @@index([sku])
  @@index([status])
  @@fulltext([name, description])
}

enum ProductStatus {
  DRAFT
  ACTIVE
  INACTIVE
  DISCONTINUED
}
```

**Fields:**

- `sku`: Stock Keeping Unit (unique identifier)
- `totalStock`: Total quantity in warehouse
- `reservedStock`: Items in pending orders
- `availableStock`: totalStock - reservedStock
- `reorderLevel`: Auto-reorder threshold
- `averageRating`: Cached from reviews (denormalized)
- `fulltext`: MySQL full-text search index

**Stock Calculation:**

```
availableStock = totalStock - reservedStock
```

**Usage Example:**

```typescript
// Create product
const product = await prisma.product.create({
  data: {
    name: "Elegant Evening Dress",
    slug: "elegant-evening-dress",
    basePrice: new Decimal("250.00"),
    salePrice: new Decimal("199.99"),
    categoryId: "cat-1",
    sku: "DRESS-001",
    totalStock: 50,
    status: "ACTIVE",
  },
});

// Update stock after order
await prisma.product.update({
  where: { id: productId },
  data: {
    reservedStock: { increment: 1 },
    availableStock: { decrement: 1 },
  },
});

// Search products
const results = await prisma.product.findMany({
  where: {
    OR: [{ name: { search: "dress" } }, { description: { search: "evening" } }],
    status: "ACTIVE",
  },
});
```

---

### 5. ProductImage Model

**Multiple images per product with WebP support**

```prisma
model ProductImage {
  id                String    @id @default(cuid())
  productId         String
  product           Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  url               String
  altText           String?
  displayOrder      Int       @default(0)
  isPrimary         Boolean   @default(false)

  createdAt         DateTime  @default(now())

  @@index([productId])
}
```

**Usage Example:**

```typescript
// Add images to product
await prisma.productImage.create({
  data: {
    productId: "prod-1",
    url: "https://cdn.example.com/dress-1.webp",
    altText: "Front view of dress",
    displayOrder: 1,
    isPrimary: true,
  },
});

// Get product with images
const product = await prisma.product.findUnique({
  where: { id: "prod-1" },
  include: {
    images: { orderBy: { displayOrder: "asc" } },
  },
});
```

---

### 6. ProductVariant Model

**Size/color combinations for products**

```prisma
model ProductVariant {
  id                String    @id @default(cuid())
  productId         String
  product           Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  size              String    // "XS", "S", "M", "L", "XL", "XXL"
  color             String?
  sku               String    @unique
  price             Decimal?  @db.Decimal(10, 2)
  stock             Int       @default(0)

  cartItems         CartItem[]
  orderItems        OrderItem[]

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([productId])
  @@index([sku])
}
```

**Usage Example:**

```typescript
// Create variants
await Promise.all([
  prisma.productVariant.create({
    data: {
      productId: "prod-1",
      size: "S",
      color: "Black",
      sku: "DRESS-001-S-BLK",
      stock: 15,
    },
  }),
  prisma.productVariant.create({
    data: {
      productId: "prod-1",
      size: "M",
      color: "Black",
      sku: "DRESS-001-M-BLK",
      stock: 20,
    },
  }),
]);

// Get product with variants
const product = await prisma.product.findUnique({
  where: { id: "prod-1" },
  include: { variants: true },
});
```

---

### 7. Order Model

**Complete order management system**

```prisma
model Order {
  id                String    @id @default(cuid())
  orderNumber       String    @unique  // "ORD-20240115-001"

  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Restrict)

  deliveryAddressId String?
  deliveryAddress   Address?  @relation(fields: [deliveryAddressId], references: [id])

  items             OrderItem[]

  subtotal          Decimal   @db.Decimal(12, 2)
  taxAmount         Decimal   @db.Decimal(10, 2)
  shippingCost      Decimal   @db.Decimal(10, 2)
  totalAmount       Decimal   @db.Decimal(12, 2)
  discountAmount    Decimal   @db.Decimal(10, 2) @default(0)

  paymentStatus     PaymentStatus @default(PENDING)
  paymentMethod     PaymentMethod
  transactionId     String?

  shippingStatus    ShippingStatus @default(PENDING)
  trackingNumber    String?
  estimatedDelivery DateTime?

  status            OrderStatus @default(PENDING)
  notes             String?   @db.Text

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([userId])
  @@index([orderNumber])
  @@index([status])
  @@index([paymentStatus])
}

enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum PaymentMethod {
  CREDIT_CARD
  DEBIT_CARD
  UPI
  NETBANKING
  WALLET
  COD
}

enum ShippingStatus {
  PENDING
  PICKED
  SHIPPED
  IN_TRANSIT
  DELIVERED
  RETURNED
}
```

**Usage Example:**

```typescript
// Create order
const order = await prisma.order.create({
  data: {
    orderNumber: `ORD-${Date.now()}`,
    userId: "user-1",
    deliveryAddressId: "addr-1",
    subtotal: new Decimal("199.99"),
    taxAmount: new Decimal("20"),
    shippingCost: new Decimal("10"),
    totalAmount: new Decimal("229.99"),
    paymentMethod: "CREDIT_CARD",
    status: "CONFIRMED",
    items: {
      create: [
        {
          productId: "prod-1",
          variantId: "var-1",
          quantity: 1,
          price: new Decimal("199.99"),
          totalPrice: new Decimal("199.99"),
        },
      ],
    },
  },
  include: { items: true },
});

// Update order status
await prisma.order.update({
  where: { id: orderId },
  data: {
    status: "SHIPPED",
    shippingStatus: "IN_TRANSIT",
    trackingNumber: "TRACK123456",
  },
});

// Get user orders
const orders = await prisma.order.findMany({
  where: { userId: "user-1" },
  include: {
    items: { include: { product: true } },
    deliveryAddress: true,
  },
  orderBy: { createdAt: "desc" },
});
```

---

### 8. CartItem Model

**Shopping cart items**

```prisma
model CartItem {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  productId         String
  product           Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  variantId         String?
  variant           ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  quantity          Int       @default(1)
  addedAt           DateTime  @default(now())

  @@unique([userId, productId, variantId])
  @@index([userId])
  @@index([productId])
}
```

**Usage Example:**

```typescript
// Add to cart
await prisma.cartItem.upsert({
  where: {
    userId_productId_variantId: {
      userId: "user-1",
      productId: "prod-1",
      variantId: "var-1",
    },
  },
  update: { quantity: { increment: 1 } },
  create: {
    userId: "user-1",
    productId: "prod-1",
    variantId: "var-1",
    quantity: 1,
  },
});

// Get cart
const cart = await prisma.cartItem.findMany({
  where: { userId: "user-1" },
  include: {
    product: true,
    variant: true,
  },
});

// Remove from cart
await prisma.cartItem.delete({
  where: { id: "cart-item-1" },
});
```

---

### 9. WishlistItem Model

**User's favorite items**

```prisma
model WishlistItem {
  id                String    @id @default(cuid())
  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  productId         String
  product           Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  createdAt         DateTime  @default(now())

  @@unique([userId, productId])
  @@index([userId])
  @@index([productId])
}
```

**Usage Example:**

```typescript
// Add to wishlist
await prisma.wishlistItem.create({
  data: {
    userId: "user-1",
    productId: "prod-1",
  },
});

// Remove from wishlist
await prisma.wishlistItem.delete({
  where: {
    userId_productId: {
      userId: "user-1",
      productId: "prod-1",
    },
  },
});

// Get wishlist
const wishlist = await prisma.wishlistItem.findMany({
  where: { userId: "user-1" },
  include: { product: true },
});
```

---

### 10. Review Model

**Product reviews and ratings**

```prisma
model Review {
  id                String    @id @default(cuid())
  productId         String
  product           Product   @relation(fields: [productId], references: [id], onDelete: Cascade)

  userId            String
  user              User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  rating            Int       // 1-5 stars
  title             String?
  comment           String?   @db.Text

  isVerified        Boolean   @default(false)  // Verified purchase
  helpful           Int       @default(0)

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([productId])
  @@index([userId])
  @@index([rating])
}
```

**Usage Example:**

```typescript
// Create review
await prisma.review.create({
  data: {
    productId: "prod-1",
    userId: "user-1",
    rating: 5,
    title: "Excellent quality!",
    comment: "This dress is amazing. Perfect fit and material.",
    isVerified: true,
  },
});

// Get product reviews
const reviews = await prisma.review.findMany({
  where: { productId: "prod-1" },
  include: { user: { select: { firstName: true } } },
  orderBy: { createdAt: "desc" },
});

// Update product rating
const avgRating = await prisma.review.aggregate({
  where: { productId: "prod-1" },
  _avg: { rating: true },
  _count: true,
});

await prisma.product.update({
  where: { id: "prod-1" },
  data: {
    averageRating: new Decimal(avgRating._avg.rating || 0),
    reviewCount: avgRating._count,
  },
});
```

---

## Queries and Operations

### Common Queries

#### Get Product with All Details

```typescript
const product = await prisma.product.findUnique({
  where: { slug: "elegant-dress" },
  include: {
    category: true,
    images: { orderBy: { displayOrder: "asc" } },
    variants: true,
    reviews: {
      where: { isVerified: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    },
  },
});
```

#### Get User with Orders

```typescript
const user = await prisma.user.findUnique({
  where: { phone: "+1234567890" },
  include: {
    orders: {
      include: {
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
    },
  },
});
```

#### Get Popular Products

```typescript
const popularProducts = await prisma.product.findMany({
  where: { status: "ACTIVE" },
  orderBy: { reviewCount: "desc" },
  take: 10,
  include: { images: { take: 1 } },
});
```

#### Get Category with Stats

```typescript
const categoryStats = await prisma.category.findUnique({
  where: { slug: "dresses" },
  include: {
    products: {
      where: { status: "ACTIVE" },
      select: { id: true },
    },
  },
});

const productCount = categoryStats?.products.length || 0;
```

---

## Indexes and Performance

**Defined Indexes:**

- User: `(phone)`, `(email)`
- Product: `(categoryId)`, `(slug)`, `(sku)`, `(status)`
- Category: `(parentId)`, `(slug)`
- Order: `(userId)`, `(orderNumber)`, `(status)`, `(paymentStatus)`

**Full-Text Search:**

- Product: name + description

**Unique Constraints:**

- User.phone, User.email
- Product.slug, Product.sku
- Category.name, Category.slug
- CartItem (userId, productId, variantId)
- WishlistItem (userId, productId)

---

## Migration Commands

```bash
# Create new migration
npm run db:migrate -- --name "add_field"

# Sync schema (dev only)
npm run db:push

# Generate Prisma client
npm run db:generate

# Open Prisma Studio
npm run db:studio

# Reset database (CAUTION!)
npx prisma migrate reset
```

---

## Best Practices

1. **Always include related data** in queries
2. **Use indexes** for frequently queried fields
3. **Cache aggregations** like averageRating
4. **Validate data** before create/update
5. **Handle decimal** prices correctly (use Decimal type)
6. **Set up relationships** with onDelete properly
7. **Use transactions** for complex operations
8. **Optimize image storage** (use CDN)

---

End of Database Reference
