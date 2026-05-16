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
};
