import prisma from "@/lib/prisma";
import type {
  Product,
  ProductVariant,
  PaginatedResponse,
  CartItem,
  CartItemWithProduct,
} from "@/types";

// ====================================
// PRODUCTS REPOSITORY
// ====================================
export const productsRepo = {
  async getAll(
    page: number = 1,
    pageSize: number = 20,
    filters?: {
      search?: string;
      categoryId?: string;
      categorySlug?: string;
      minPrice?: number;
      maxPrice?: number;
      status?: string;
    },
  ): Promise<PaginatedResponse<Product>> {
    const skip = (page - 1) * pageSize;

    const where: any = {
      status: filters?.status || "ACTIVE",
      isDeleted: false,
    };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.categorySlug) {
      where.category = { slug: filters.categorySlug };
    }

    if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters?.minPrice !== undefined) {
        where.basePrice.gte = filters.minPrice;
      }
      if (filters?.maxPrice !== undefined) {
        where.basePrice.lte = filters.maxPrice;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          images: { take: 3 },
          category: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: products,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  async getBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { displayOrder: "asc" } },
        variants: true,
        category: true,
        reviews: { take: 10, orderBy: { createdAt: "desc" } },
      },
    });
  },

  async getById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
        category: true,
      },
    });
  },

  async getBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
      include: { variants: true },
    });
  },

  async create(data: any) {
    return prisma.product.create({
      data,
      include: { category: true },
    });
  },

  async update(id: string, data: any) {
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  },

  async delete(id: string) {
    return prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });
  },

  async reserveStock(
    productId: string,
    quantity: number,
  ): Promise<{ success: boolean; message: string }> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, message: "Product not found" };
    }

    if (product.availableStock < quantity) {
      return { success: false, message: "Insufficient stock" };
    }

    await prisma.product.update({
      where: { id: productId },
      data: {
        availableStock: { decrement: quantity },
        reservedStock: { increment: quantity },
      },
    });

    return { success: true, message: "Stock reserved" };
  },

  async releaseReservedStock(
    productId: string,
    quantity: number,
  ): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: {
        availableStock: { increment: quantity },
        reservedStock: { decrement: quantity },
      },
    });
  },

  async confirmStock(productId: string, quantity: number): Promise<void> {
    await prisma.product.update({
      where: { id: productId },
      data: {
        totalStock: { decrement: quantity },
        reservedStock: { decrement: quantity },
      },
    });
  },
};

// ====================================
// CART REPOSITORY
// ====================================
export const cartRepo = {
  async getByUserId(userId: string): Promise<CartItemWithProduct[]> {
    return prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: { include: { images: { take: 1 } } },
        variant: true,
      },
      orderBy: { addedAt: "desc" },
    });
  },

  async getItem(cartItemId: string) {
    return prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { product: true, variant: true },
    });
  },

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    variantId?: string,
  ) {
    return prisma.cartItem.upsert({
      where: {
        userId_productId_variantId: {
          userId,
          productId,
          variantId: variantId || null,
        },
      },
      update: { quantity: { increment: quantity } },
      create: { userId, productId, quantity, variantId },
      include: { product: true, variant: true },
    });
  },

  async updateQuantity(cartItemId: string, quantity: number) {
    return prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity: Math.max(0, quantity) },
      include: { product: true, variant: true },
    });
  },

  async removeItem(cartItemId: string) {
    return prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  },

  async clearCart(userId: string) {
    return prisma.cartItem.deleteMany({
      where: { userId },
    });
  },

  async countItems(userId: string): Promise<number> {
    return prisma.cartItem.count({
      where: { userId },
    });
  },
};

// ====================================
// ORDERS REPOSITORY
// ====================================
export const ordersRepo = {
  async create(data: any) {
    return prisma.order.create({
      data,
      include: {
        items: { include: { product: true, variant: true } },
        user: true,
        deliveryAddress: true,
        payments: true,
      },
    });
  },

  async getById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, variant: true } },
        user: true,
        deliveryAddress: true,
        payments: true,
      },
    });
  },

  async getByOrderNumber(orderNumber: string) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: true, variant: true } },
        user: true,
        deliveryAddress: true,
        payments: true,
      },
    });
  },

  async getByUserId(
    userId: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResponse<any>> {
    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: pageSize,
        include: {
          items: { include: { product: true } },
          deliveryAddress: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: orders,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  },

  async update(id: string, data: any) {
    return prisma.order.update({
      where: { id },
      data,
      include: {
        items: { include: { product: true, variant: true } },
        user: true,
        payments: true,
      },
    });
  },
};

// ====================================
// PAYMENT REPOSITORY
// ====================================
export const paymentsRepo = {
  async create(data: any) {
    return prisma.payment.create({
      data,
      include: { order: true },
    });
  },

  async getByOrderId(orderId: string) {
    return prisma.payment.findUnique({
      where: { orderId },
      include: { order: true },
    });
  },

  async getByAuthority(authority: string) {
    return prisma.payment.findUnique({
      where: { authority },
      include: { order: true },
    });
  },

  async update(id: string, data: any) {
    return prisma.payment.update({
      where: { id },
      data,
      include: { order: true },
    });
  },

  async updateByOrderId(orderId: string, data: any) {
    return prisma.payment.update({
      where: { orderId },
      data,
      include: { order: true },
    });
  },
};

// ====================================
// USERS REPOSITORY
// ====================================
export const usersRepo = {
  async getById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        addresses: true,
        orders: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });
  },

  async getByPhone(phone: string) {
    return prisma.user.findUnique({
      where: { phone },
    });
  },

  async getByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async create(data: any) {
    return prisma.user.create({
      data,
    });
  },

  async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  },

  async getAll(page: number = 1, pageSize: number = 20) {
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: pageSize,
        include: { addresses: true, orders: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: users,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  },
};

// ====================================
// ADDRESS REPOSITORY
// ====================================
export const addressesRepo = {
  async getByUserId(userId: string) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: "desc" },
    });
  },

  async create(data: any) {
    return prisma.address.create({ data });
  },

  async update(id: string, data: any) {
    return prisma.address.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.address.delete({
      where: { id },
    });
  },
};

// ====================================
// CATEGORIES REPOSITORY
// ====================================
export const categoriesRepo = {
  async getAll(onlyActive = true) {
    return prisma.category.findMany({
      where: onlyActive ? { isActive: true } : {},
      include: { children: true, _count: { select: { products: true } } },
      orderBy: { displayOrder: "asc" },
    });
  },

  async getBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: { children: true, products: true },
    });
  },

  async create(data: any) {
    return prisma.category.create({
      data,
      include: { children: true },
    });
  },

  async update(id: string, data: any) {
    return prisma.category.update({
      where: { id },
      data,
      include: { children: true },
    });
  },

  async delete(id: string) {
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  },
};
