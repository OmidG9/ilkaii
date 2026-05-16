import { z } from "zod";

// ====================================
// PRODUCT VALIDATORS
// ====================================
export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  categorySlug: z.string().optional(),
  sortBy: z
    .enum(["price-asc", "price-desc", "newest", "popular", "rating"])
    .optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "INACTIVE", "DISCONTINUED"]).optional(),
});

export const createProductSchema = z.object({
  name: z.string().min(3, "Product name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().cuid("Invalid category ID"),
  basePrice: z.number().positive("Price must be positive"),
  salePrice: z.number().positive().optional(),
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  barcode: z.string().optional(),
  totalStock: z.number().nonnegative().int(),
  reorderLevel: z.number().nonnegative().int().default(10),
  heroImage: z.string().url().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  status: z
    .enum(["DRAFT", "ACTIVE", "INACTIVE", "DISCONTINUED"])
    .default("DRAFT"),
});

export const updateProductSchema = createProductSchema.partial();

export const productVariantSchema = z.object({
  size: z.string().min(1, "Size is required"),
  color: z.string().optional(),
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  price: z.number().positive().optional(),
  stock: z.number().nonnegative().int().default(0),
});

// ====================================
// CART VALIDATORS
// ====================================
export const addToCartSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  variantId: z.string().cuid().optional(),
  quantity: z.number().int().positive("Quantity must be at least 1").max(100),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive("Quantity must be at least 1").max(100),
});

export const removeFromCartSchema = z.object({
  cartItemId: z.string().cuid("Invalid cart item ID"),
});

// ====================================
// ORDER VALIDATORS
// ====================================
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().cuid("Invalid product ID"),
        variantId: z.string().cuid().optional(),
        quantity: z.number().int().positive(),
      }),
    )
    .nonempty("At least one item is required"),
  deliveryAddressId: z.string().cuid("Invalid delivery address ID"),
  paymentMethod: z.enum([
    "CREDIT_CARD",
    "DEBIT_CARD",
    "UPI",
    "NETBANKING",
    "WALLET",
    "COD",
  ]),
  discountCode: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
  authority: z.string().min(1, "Authority is required"),
  status: z.string().optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
  notes: z.string().optional(),
  trackingNumber: z.string().optional(),
});

// ====================================
// ADDRESS VALIDATORS
// ====================================
export const createAddressSchema = z.object({
  label: z.string().min(2, "Label must be at least 2 characters"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[0-9]{10,}$/, "Invalid phone number format"),
  street: z.string().min(5, "Street must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.string().min(2, "State must be at least 2 characters"),
  postalCode: z.string().min(3, "Postal code must be at least 3 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();

// ====================================
// USER VALIDATORS
// ====================================
export const loginSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,}$/, "Invalid phone number format"),
});

export const verifyOtpSchema = z.object({
  phone: z.string().regex(/^\+?[0-9]{10,}$/, "Invalid phone number format"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  avatar: z.string().url().optional(),
});

// ====================================
// REVIEW VALIDATORS
// ====================================
export const createReviewSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(5, "Title must be at least 5 characters").optional(),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .optional(),
});

// ====================================
// CATEGORY VALIDATORS
// ====================================
export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  description: z.string().optional(),
  image: z.string().url().optional(),
  icon: z.string().optional(),
  parentId: z.string().cuid().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().nonnegative().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

// ====================================
// ENVIRONMENT VALIDATORS
// ====================================
export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  ZARINPAL_MERCHANT_ID: z.string().min(1),
  ZARINPAL_SANDBOX: z.enum(["true", "false"]).default("false"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type AddToCart = z.infer<typeof addToCartSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;
export type CreateAddress = z.infer<typeof createAddressSchema>;
export type VerifyPayment = z.infer<typeof verifyPaymentSchema>;
export type CreateReview = z.infer<typeof createReviewSchema>;
