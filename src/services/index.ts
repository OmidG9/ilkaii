import {
  productsRepo,
  cartRepo,
  ordersRepo,
  paymentsRepo,
} from "@/lib/repositories";
import prisma from "@/lib/prisma";
import {
  calculateOrderTotals,
  generateOrderNumber,
  ApiError,
  canReserveStock,
} from "@/lib/utils";
import type { CreateOrder } from "@/lib/validators";

const ZARINPAL_API_BASE =
  process.env.ZARINPAL_SANDBOX === "true"
    ? "https://sandbox.zarinpal.com/pg/v4/payment"
    : "https://api.zarinpal.com/pg/v4/payment";

// ====================================
// ORDER SERVICE
// ====================================
export const orderService = {
  async createOrder(userId: string, orderData: CreateOrder) {
    // Validate cart items
    const cartItems = await cartRepo.getByUserId(userId);

    if (cartItems.length === 0) {
      throw new ApiError(400, "Cart is empty");
    }

    // Validate all products exist and are available
    let subtotal = 0;
    const orderItems = [];

    for (const item of orderData.items) {
      const product = await productsRepo.getById(item.productId);

      if (!product) {
        throw new ApiError(400, `Product ${item.productId} not found`);
      }

      if (product.status !== "ACTIVE") {
        throw new ApiError(400, `Product ${product.name} is not available`);
      }

      if (!canReserveStock(product.availableStock, item.quantity)) {
        throw new ApiError(
          400,
          `Insufficient stock for ${product.name}. Available: ${product.availableStock}`,
        );
      }

      const price = product.salePrice || product.basePrice;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price,
        totalPrice: itemTotal,
      });
    }

    const totals = calculateOrderTotals(subtotal);

    // Create order with transaction
    return await prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          deliveryAddressId: orderData.deliveryAddressId,
          paymentMethod: orderData.paymentMethod,
          ...totals,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: { include: { product: true } },
          user: true,
        },
      });

      // Reserve stock for all items
      for (const item of orderData.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            availableStock: { decrement: item.quantity },
            reservedStock: { increment: item.quantity },
          },
        });
      }

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: totals.totalAmount,
          status: "PENDING",
        },
      });

      return order;
    });
  },

  async initiatePayment(orderId: string, callbackUrl: string) {
    const order = await ordersRepo.getById(orderId);

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.paymentStatus !== "PENDING") {
      throw new ApiError(400, "Order is not in pending state");
    }

    const payment = await paymentsRepo.getByOrderId(orderId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    // Create Zarinpal request
    const response = await fetch(`${ZARINPAL_API_BASE}/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: process.env.ZARINPAL_MERCHANT_ID,
        amount: Math.round(order.totalAmount * 10), // Convert to Toman (1 IRR = 10 Toman)
        callback_url: callbackUrl,
        description: `Order ${order.orderNumber}`,
        metadata: { order_id: orderId },
      }),
    });

    const data = await response.json();

    if (data.data?.code !== 100) {
      throw new ApiError(
        400,
        data.errors?.message || "Failed to create payment",
      );
    }

    // Store authority in payment record
    if (data.data?.authority) {
      await paymentsRepo.update(payment.id, {
        authority: data.data.authority,
      });
    }

    return {
      authority: data.data.authority,
      paymentUrl: `${ZARINPAL_API_BASE.replace("/request.json", "")}/start/${data.data.authority}`,
    };
  },

  async verifyPayment(authority: string) {
    const payment = await paymentsRepo.getByAuthority(authority);

    if (!payment) {
      throw new ApiError(404, "Payment not found");
    }

    const order = await ordersRepo.getById(payment.orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Verify with Zarinpal
    const response = await fetch(`${ZARINPAL_API_BASE}/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: process.env.ZARINPAL_MERCHANT_ID,
        amount: Math.round(order.totalAmount * 10),
        authority,
      }),
    });

    const data = await response.json();

    // Transaction for payment confirmation
    return await prisma.$transaction(async (tx) => {
      if (data.data?.code === 100 || data.data?.code === 101) {
        // Payment successful
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            refId: data.data.ref_id?.toString(),
            gatewayResponse: data.data,
          },
        });

        // Update order
        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "COMPLETED",
            status: "CONFIRMED",
            transactionId: data.data.ref_id?.toString(),
          },
        });

        // Confirm stock (move from reserved to sold)
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              totalStock: { decrement: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });
        }

        // Clear user's cart
        await tx.cartItem.deleteMany({
          where: { userId: order.userId },
        });

        return { success: true, order, refId: data.data.ref_id };
      } else {
        // Payment failed
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "FAILED",
            gatewayResponse: data,
          },
        });

        await tx.order.update({
          where: { id: payment.orderId },
          data: {
            paymentStatus: "FAILED",
            status: "CANCELLED",
          },
        });

        // Release reserved stock
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              availableStock: { increment: item.quantity },
              reservedStock: { decrement: item.quantity },
            },
          });
        }

        throw new ApiError(400, "Payment verification failed");
      }
    });
  },
};

// ====================================
// CART SERVICE
// ====================================
export const cartService = {
  async addToCart(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
  ) {
    // Validate product exists and is active
    const product = await productsRepo.getById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (product.status !== "ACTIVE") {
      throw new ApiError(400, "Product is not available");
    }

    if (quantity > product.availableStock) {
      throw new ApiError(400, `Only ${product.availableStock} items available`);
    }

    return await cartRepo.addItem(userId, productId, quantity, variantId);
  },

  async removeFromCart(userId: string, cartItemId: string) {
    const item = await cartRepo.getItem(cartItemId);

    if (!item || item.userId !== userId) {
      throw new ApiError(404, "Cart item not found");
    }

    return await cartRepo.removeItem(cartItemId);
  },

  async updateCart(userId: string, cartItemId: string, quantity: number) {
    if (quantity <= 0) {
      return await this.removeFromCart(userId, cartItemId);
    }

    const item = await cartRepo.getItem(cartItemId);
    if (!item || item.userId !== userId) {
      throw new ApiError(404, "Cart item not found");
    }

    const product = await productsRepo.getById(item.productId);
    if (!product || quantity > product.availableStock) {
      throw new ApiError(
        400,
        `Only ${product?.availableStock || 0} items available`,
      );
    }

    return await cartRepo.updateQuantity(cartItemId, quantity);
  },

  async getCartSummary(userId: string) {
    const items = await cartRepo.getByUserId(userId);

    let subtotal = 0;
    for (const item of items) {
      const price = item.product.salePrice || item.product.basePrice;
      subtotal += price * item.quantity;
    }

    const totals = calculateOrderTotals(subtotal);

    return {
      items,
      itemCount: items.length,
      ...totals,
    };
  },
};

// ====================================
// PRODUCTS SERVICE
// ====================================
export const productsService = {
  async getProduct(identifier: string) {
    let product = await productsRepo.getBySlug(identifier);
    if (!product) {
      product = await productsRepo.getById(identifier);
    }
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return product;
  },

  async getProducts(filters: any) {
    return await productsRepo.getAll(filters.page, filters.pageSize, {
      search: filters.search,
      categoryId: filters.categoryId,
      categorySlug: filters.categorySlug,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      status: "ACTIVE",
    });
  },

  async createProduct(data: any) {
    // Validate slug uniqueness
    const existing = await productsRepo.getBySlug(data.slug);
    if (existing) {
      throw new ApiError(400, "Slug already exists");
    }

    // Initialize stock counts
    const productData = {
      ...data,
      availableStock: data.totalStock || 0,
      reservedStock: 0,
    };

    return await productsRepo.create(productData);
  },

  async updateProduct(id: string, data: any) {
    const product = await productsRepo.getById(id);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // If slug changed, check uniqueness
    if (data.slug && data.slug !== product.slug) {
      const existing = await productsRepo.getBySlug(data.slug);
      if (existing) {
        throw new ApiError(400, "Slug already exists");
      }
    }

    return await productsRepo.update(id, data);
  },

  async deleteProduct(id: string) {
    const product = await productsRepo.getById(id);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }
    return await productsRepo.delete(id);
  },

  async addProductImages(productId: string, images: any[]) {
    const product = await productsRepo.getById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return await Promise.all(
      images.map((img, idx) =>
        prisma.productImage.create({
          data: {
            productId,
            url: img.url,
            altText: img.altText || "Product image",
            displayOrder: img.displayOrder || idx,
            isPrimary: idx === 0,
          },
        }),
      ),
    );
  },

  async deleteProductImage(imageId: string) {
    return await prisma.productImage.delete({
      where: { id: imageId },
    });
  },

  async addProductVariant(productId: string, variant: any) {
    const product = await productsRepo.getById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return await prisma.productVariant.create({
      data: {
        productId,
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        price: variant.price,
        stock: variant.stock || 0,
      },
    });
  },

  async updateProductVariant(variantId: string, data: any) {
    return await prisma.productVariant.update({
      where: { id: variantId },
      data,
    });
  },

  async deleteProductVariant(variantId: string) {
    return await prisma.productVariant.delete({
      where: { id: variantId },
    });
  },
};

// ====================================
// USER SERVICE
// ====================================
export const userService = {
  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        orders: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Remove sensitive data
    const { otp, otpExpiry, otpAttempts, ...safeUser } = user;
    return safeUser;
  },

  async updateUserProfile(userId: string, data: any) {
    const allowedFields = ["firstName", "lastName", "email", "avatar", "phone"];
    const updateData = Object.fromEntries(
      Object.entries(data).filter(([key]) => allowedFields.includes(key)),
    );

    return await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { addresses: true },
    });
  },

  async createAddress(userId: string, data: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // If this is the first address or marked as default, make it default
    const addressCount = await prisma.address.count({
      where: { userId },
    });

    return await prisma.address.create({
      data: {
        ...data,
        userId,
        isDefault: addressCount === 0 || data.isDefault,
      },
    });
  },

  async updateAddress(addressId: string, userId: string, data: any) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new ApiError(404, "Address not found");
    }

    // If making default, unset other defaults
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    return await prisma.address.update({
      where: { id: addressId },
      data,
    });
  },

  async deleteAddress(addressId: string, userId: string) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new ApiError(404, "Address not found");
    }

    return await prisma.address.delete({
      where: { id: addressId },
    });
  },

  async getUserOrders(userId: string, page: number = 1) {
    return await ordersRepo.getByUserId(userId, page);
  },
};

// ====================================
// REVIEW SERVICE
// ====================================
export const reviewService = {
  async createReview(userId: string, data: any) {
    const product = await productsRepo.getById(data.productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Check if user already reviewed
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId: data.productId } },
    });

    if (existing) {
      throw new ApiError(400, "You already reviewed this product");
    }

    return await prisma.review.create({
      data: {
        ...data,
        userId,
        isVerified: true, // Mark as verified from authenticated user
      },
      include: { user: { select: { firstName: true, avatar: true } } },
    });
  },

  async updateReview(reviewId: string, userId: string, data: any) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== userId) {
      throw new ApiError(404, "Review not found");
    }

    return await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        comment: data.comment,
      },
    });
  },

  async deleteReview(reviewId: string, userId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review || review.userId !== userId) {
      throw new ApiError(404, "Review not found");
    }

    return await prisma.review.delete({
      where: { id: reviewId },
    });
  },

  async getProductReviews(
    productId: string,
    page: number = 1,
    pageSize: number = 10,
  ) {
    const skip = (page - 1) * pageSize;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        skip,
        take: pageSize,
        include: {
          user: { select: { firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { productId } }),
    ]);

    return {
      data: reviews,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  },
};

// ====================================
// WISHLIST SERVICE
// ====================================
export const wishlistService = {
  async addToWishlist(userId: string, productId: string) {
    const product = await productsRepo.getById(productId);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      throw new ApiError(400, "Already in wishlist");
    }

    return await prisma.wishlistItem.create({
      data: { userId, productId },
      include: { product: true },
    });
  },

  async removeFromWishlist(userId: string, productId: string) {
    const item = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!item) {
      throw new ApiError(404, "Item not in wishlist");
    }

    return await prisma.wishlistItem.delete({
      where: { id: item.id },
    });
  },

  async getWishlist(userId: string, page: number = 1) {
    const skip = (page - 1) * 20;

    const [items, total] = await Promise.all([
      prisma.wishlistItem.findMany({
        where: { userId },
        skip,
        take: 20,
        include: { product: { include: { images: { take: 1 } } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.wishlistItem.count({ where: { userId } }),
    ]);

    return {
      data: items,
      total,
      page,
      pageSize: 20,
      totalPages: Math.ceil(total / 20),
    };
  },
};

// ====================================
// ADMIN SERVICE
// ====================================
export const adminService = {
  async getAllOrders(page: number = 1, filters?: any) {
    const skip = (page - 1) * 10;
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search } },
        { user: { phone: { contains: filters.search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: 10,
        include: {
          user: { select: { id: true, phone: true, firstName: true } },
          items: { include: { product: true } },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      total,
      page,
      pageSize: 10,
      totalPages: Math.ceil(total / 10),
    };
  },

  async updateOrderStatus(orderId: string, status: string) {
    const order = await ordersRepo.getById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { product: true } },
        user: true,
        payments: true,
      },
    });
  },

  async addTrackingNumber(orderId: string, trackingNumber: string) {
    const order = await ordersRepo.getById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return await prisma.order.update({
      where: { id: orderId },
      data: { trackingNumber },
    });
  },

  async getAllUsers(page: number = 1) {
    return await prisma.user.findMany();
  },

  async getUserDetails(userId: string) {
    const user = await userService.getUserProfile(userId);
    return user;
  },

  async getAllCategories() {
    return await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { displayOrder: "asc" },
    });
  },

  async createCategory(data: any) {
    return await prisma.category.create({
      data,
    });
  },

  async updateCategory(categoryId: string, data: any) {
    return await prisma.category.update({
      where: { id: categoryId },
      data,
    });
  },

  async deleteCategory(categoryId: string) {
    return await prisma.category.delete({
      where: { id: categoryId },
    });
  },

  async getInventoryReport() {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        sku: true,
        totalStock: true,
        reservedStock: true,
        availableStock: true,
        reorderLevel: true,
      },
    });

    const lowStock = products.filter((p) => p.availableStock <= p.reorderLevel);

    return {
      total: products.length,
      lowStock: lowStock.length,
      products,
      lowStockProducts: lowStock,
    };
  },
};
