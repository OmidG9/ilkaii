// ====================================
// USER TYPES
// ====================================
export interface User {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  isVerified: boolean;
  role: "CUSTOMER" | "ADMIN" | "VENDOR";
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ====================================
// PRODUCT TYPES
// ====================================
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  currency: string;
  sku: string;
  barcode?: string;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel: number;
  status: "DRAFT" | "ACTIVE" | "INACTIVE" | "DISCONTINUED";
  categoryId: string;
  heroImage?: string;
  averageRating?: number;
  reviewCount: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color?: string;
  sku: string;
  price?: number;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// ====================================
// CART TYPES
// ====================================
export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  addedAt: Date;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
  variant?: ProductVariant;
}

// ====================================
// ORDER TYPES
// ====================================
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type PaymentMethod =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "UPI"
  | "NETBANKING"
  | "WALLET"
  | "COD";
export type ShippingStatus =
  | "PENDING"
  | "PICKED"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "RETURNED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  deliveryAddressId?: string;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  discountAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  shippingStatus: ShippingStatus;
  trackingNumber?: string;
  estimatedDelivery?: Date;
  status: OrderStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  authority?: string;
  refId?: string;
  status: PaymentStatus;
  gateway: string;
  gatewayResponse?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ====================================
// API RESPONSE TYPES
// ====================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// ====================================
// PAYMENT GATEWAY TYPES
// ====================================
export interface ZarinpalRequestResponse {
  data: {
    code: number;
    message: string;
    authority?: string;
  };
  errors: any;
}

export interface ZarinpalVerifyResponse {
  data: {
    code: number;
    message: string;
    card_hash?: string;
    card_pan?: string;
    ref_id?: string;
    fee?: number;
    fee_type?: string;
  };
  errors: any;
}

// ====================================
// REVIEW TYPES
// ====================================
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  isVerified: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}
