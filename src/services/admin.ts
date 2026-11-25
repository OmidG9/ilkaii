import type { OrderStatus, Prisma, ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { invalidateCache } from "@/lib/cache";
import { toToman } from "@/lib/money";
import { editableSettingKeys, getSiteConfig } from "@/config/site";
import { cancelOrder } from "@/services/checkout";
import { recordAnalyticsEvent } from "@/services/analytics";
import type { z } from "zod";
import type { couponSchema, orderStatusSchema, settingsSchema } from "@/lib/validation";

type CouponInput = z.infer<typeof couponSchema>;
type OrderStatusInput = z.infer<typeof orderStatusSchema>;
type SettingsInput = z.infer<typeof settingsSchema>;

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export async function getDashboardStats() {
  const [orders, paidOrders, pending, revenue, products, lowStock, recentOrders, customers] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: "PAID" } }),
    prisma.order.count({ where: { status: { in: ["PENDING_PAYMENT", "PAID", "PROCESSING"] } } }),
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalAmount: true } }),
    prisma.product.count({ where: { isDeleted: false } }),
    prisma.productVariant.count({ where: { stock: { lte: 5 }, isAvailable: true, product: { isDeleted: false } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { phone: true, firstName: true, lastName: true } } } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);

  const salesByDay = await prisma.$queryRaw<Array<{ day: string; total: number; count: number }>>`
    SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS day,
           CAST(SUM(totalAmount) AS SIGNED) AS total,
           COUNT(*) AS count
    FROM \`Order\`
    WHERE paymentStatus = 'PAID' AND createdAt >= DATE_SUB(NOW(), INTERVAL 14 DAY)
    GROUP BY day ORDER BY day ASC
  `;

  return {
    totalOrders: orders,
    paidOrders,
    pendingOrders: pending,
    revenue: toToman(revenue._sum.totalAmount ?? 0),
    products,
    lowStock,
    customers,
    recentOrders: recentOrders.map((order) => ({ ...order, total: toToman(order.totalAmount) })),
    salesByDay: salesByDay.map((row) => ({ day: row.day, total: Number(row.total), count: Number(row.count) })),
  };
}

export async function listAdminOrders(params: { page: number; pageSize: number; status?: OrderStatus; q?: string; sort?: "newest" | "oldest" | "total-desc" | "total-asc" }) {
  const where: Prisma.OrderWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.q ? { OR: [
      { orderNumber: { contains: params.q } },
      { user: { phone: { contains: params.q } } },
      { recipientPhone: { contains: params.q } },
    ] } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where, orderBy: params.sort === "oldest" ? { createdAt: "asc" } : params.sort === "total-desc" ? { totalAmount: "desc" } : params.sort === "total-asc" ? { totalAmount: "asc" } : { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize, take: params.pageSize,
      include: { user: { select: { id: true, phone: true, firstName: true, lastName: true } }, _count: { select: { items: true } } },
    }),
  ]);
  return { items: items.map((o) => ({ ...o, total: toToman(o.totalAmount) })), total, page: params.page, pageCount: Math.max(1, Math.ceil(total / params.pageSize)) };
}

export async function getAdminOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, phone: true, firstName: true, lastName: true, email: true } },
      items: true,
      payments: true,
      shipments: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      returnRequests: true,
    },
  });
  if (!order) throw Errors.notFound("سفارش یافت نشد");
  return {
    ...order,
    subtotal: toToman(order.subtotal), discount: toToman(order.discountAmount),
    shipping: toToman(order.shippingCost), total: toToman(order.totalAmount),
    items: order.items.map((i) => ({ ...i, unitPrice: toToman(i.unitPrice), lineTotal: toToman(i.lineTotal) })),
    payments: order.payments.map((payment) => ({ ...payment, amount: toToman(payment.amount) })),
    returnRequests: order.returnRequests.map((request) => ({ ...request })),
  };
}

export async function updateOrderStatus(id: string, input: OrderStatusInput, actorId: string) {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw Errors.notFound("سفارش یافت نشد");
  if (!TRANSITIONS[order.status].includes(input.status)) {
    throw Errors.conflict(`تغییر وضعیت از ${order.status} به ${input.status} مجاز نیست`);
  }
  if (input.status === "CANCELLED") {
    await cancelOrder(id, actorId);
    return getAdminOrder(id);
  }
  if (input.status === "REFUNDED") {
    // Refunds can happen after shipping, so they must not reuse cancelOrder
    // (which forbids shipped/delivered orders). Restocking is handled by the
    // return workflow when goods are actually received back.
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { status: "REFUNDED", paymentStatus: "REFUNDED" } });
      await tx.payment.updateMany({ where: { orderId: id }, data: { status: "REFUNDED" } });
      await tx.orderStatusHistory.create({
        data: {
          orderId: id, fromStatus: order.status, toStatus: "REFUNDED",
          note: input.note ?? "بازپرداخت ثبت شد", changedById: actorId,
        },
      });
    });
    await audit({ actorId, action: "order.refunded", entity: "Order", entityId: id, metadata: { note: input.note } });
    if (order.analyticsSessionId) {
      await recordAnalyticsEvent({
        eventId: `refund-${id}`,
        name: "refund",
        path: "/admin/orders",
        metadata: { revenue: -toToman(order.totalAmount), orderId: id, orderNumber: order.orderNumber },
      }, {
        sessionId: order.analyticsSessionId,
        customerId: order.userId,
        consentGranted: true,
        serverEvent: true,
      });
    }
    invalidateCache("dashboard:");
    return getAdminOrder(id);
  }
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: {
        status: input.status,
        paymentStatus: input.status === "PAID" ? "PAID" : order.paymentStatus,
        ...(input.status === "SHIPPED" ? { shippingMethod: order.shippingMethod } : {}),
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId: id, fromStatus: order.status, toStatus: input.status, note: input.note ?? null, changedById: actorId },
    });
    if (input.trackingNumber) {
      await tx.shipment.create({
        data: { orderId: id, provider: "POSTAL", trackingNumber: input.trackingNumber, status: input.status === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT" },
      });
      await tx.order.update({ where: { id }, data: { trackingNumber: input.trackingNumber } });
    }
    await audit({ actorId, action: "order.status_changed", entity: "Order", entityId: id, metadata: { from: order.status, to: input.status } });
  });
  invalidateCache("dashboard:");
  return getAdminOrder(id);
}

export async function listCustomers(params: { page: number; pageSize: number; q?: string }) {
  const where = params.q ? {
    OR: [
      { phone: { contains: params.q } },
      { firstName: { contains: params.q } },
      { lastName: { contains: params.q } },
    ],
  } : {};
  const [total, items] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize, take: params.pageSize,
      select: {
        id: true, phone: true, firstName: true, lastName: true, email: true, role: true, isActive: true, createdAt: true,
        _count: { select: { orders: true } },
        orders: { select: { totalAmount: true }, where: { paymentStatus: "PAID" } },
      },
    }),
  ]);
  return {
    items: items.map((u) => ({ ...u, spent: u.orders.reduce((sum, o) => sum + toToman(o.totalAmount), 0), orders: undefined })),
    total, page: params.page, pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function updateCustomer(
  id: string,
  input: { role?: string; isActive?: boolean },
  actorId: string,
) {
  const actor = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true } });
  if (!actor) throw Errors.unauthorized();

  // Role grants are the highest-risk mutation: only the super admin may perform
  // them, and nobody may change their own role (lockout protection).
  if (input.role) {
    if (actor.role !== "SUPER_ADMIN") throw Errors.forbidden("فقط مدیرکل میتواند نقشها را تغییر دهد");
    if (id === actorId) throw Errors.conflict("نمیتوانید نقش خودتان را تغییر دهید");
  }

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: input,
      select: { id: true, phone: true, role: true, isActive: true },
    });
    if (input.role) {
      const role = await tx.role.findUnique({ where: { code: input.role }, select: { id: true } });
      if (!role) throw Errors.badRequest("نقش نامعتبر است");
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.create({ data: { userId: id, roleId: role.id, assignedById: actorId } });
    }
    return updated;
  });
  await audit({ actorId, action: "customer.updated", entity: "User", entityId: id, metadata: input });
  return user;
}

export async function listCoupons() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return coupons.map((c) => ({ ...c, value: toToman(c.value), minPurchase: c.minPurchase ? toToman(c.minPurchase) : null, maxDiscount: c.maxDiscount ? toToman(c.maxDiscount) : null }));
}

export async function createCoupon(input: CouponInput) {
  const code = input.code.toUpperCase();
  if (await prisma.coupon.findUnique({ where: { code } })) throw Errors.conflict("کد تخفیف وجود دارد");
  return prisma.coupon.create({
    data: {
      ...input, code,
      minPurchase: input.minPurchase ?? null, maxDiscount: input.maxDiscount ?? null,
      usageLimit: input.usageLimit ?? null, perUserLimit: input.perUserLimit ?? null,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
}

export async function updateCoupon(id: string, input: Partial<CouponInput>) {
  return prisma.coupon.update({
    where: { id },
    data: {
      ...input,
      startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    },
  });
}

export async function deleteCoupon(id: string) {
  await prisma.coupon.delete({ where: { id } });
}

export async function listReturns() {
  return prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true, totalAmount: true } }, user: { select: { phone: true, firstName: true, lastName: true } } },
  });
}

export async function processReturn(id: string, status: "APPROVED" | "REJECTED" | "COMPLETED", note: string | undefined, actorId: string) {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.returnRequest.findUnique({ where: { id } });
    if (!existing) throw Errors.notFound("درخواست بازگشت یافت نشد");
    const updated = await tx.returnRequest.update({ where: { id }, data: { status, note: note ?? null } });

    // Completing a return puts the goods back on the shelf exactly once.
    if (status === "COMPLETED" && existing.status !== "COMPLETED") {
      const items = await tx.orderItem.findMany({
        where: { orderId: existing.orderId },
        select: { variantId: true, quantity: true },
      });
      const touchedProducts = new Set<string>();
      for (const item of items) {
        if (!item.variantId) continue;
        const variant = await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
          select: { productId: true },
        });
        touchedProducts.add(variant.productId);
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId, orderId: existing.orderId, quantity: item.quantity,
            reason: "RETURN", note: "بازگشت کالا", userId: actorId,
          },
        });
      }
      for (const productId of touchedProducts) {
        const sum = await tx.productVariant.aggregate({ where: { productId }, _sum: { stock: true } });
        await tx.product.update({
          where: { id: productId },
          data: { totalStock: sum._sum.stock ?? 0, availableStock: sum._sum.stock ?? 0 },
        });
      }
    }
    return updated;
  });
  await audit({ actorId, action: "return.processed", entity: "ReturnRequest", entityId: id, metadata: { status } });
  return result;
}

export async function listAuditLogs(page = 1, pageSize = 30, filters: { q?: string; severity?: string; entity?: string } = {}) {
  const where: Prisma.AuditLogWhereInput = {
    ...(filters.severity ? { severity: filters.severity } : {}),
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(filters.q ? { OR: [
      { action: { contains: filters.q } },
      { actorPhone: { contains: filters.q } },
      { entityId: { contains: filters.q } },
      { requestId: { contains: filters.q } },
    ] } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

async function recalcProductRating(productId: string) {
  const aggregate = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: aggregate._avg.rating ?? null,
      reviewCount: aggregate._count,
    },
  });
}

export async function listAdminProducts(params: { page: number; pageSize: number; q?: string; status?: ProductStatus; sort?: "newest" | "price-asc" | "price-desc" | "stock-asc" | "name" }) {
  const where: Prisma.ProductWhereInput = {
    isDeleted: false,
    ...(params.status ? { status: params.status } : {}),
    ...(params.q ? { OR: [
      { name: { contains: params.q } },
      { sku: { contains: params.q } },
      { searchText: { contains: params.q } },
    ] } : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc" ? { basePrice: "asc" } :
    params.sort === "price-desc" ? { basePrice: "desc" } :
    params.sort === "stock-asc" ? { availableStock: "asc" } :
    params.sort === "name" ? { name: "asc" } : { createdAt: "desc" };
  const [total, items] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        _count: { select: { variants: true } },
      },
    }),
  ]);
  return {
    items: items.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      status: product.status,
      basePrice: toToman(product.basePrice),
      salePrice: product.salePrice ? toToman(product.salePrice) : null,
      availableStock: product.availableStock,
      category: product.category.name,
      brand: product.brand?.name ?? null,
      image: product.images[0]?.url ?? null,
      variants: product._count.variants,
      isDeleted: product.isDeleted,
    })),
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function getAdminProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      images: { orderBy: { displayOrder: "asc" } },
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
    },
  });
  if (!product) throw Errors.notFound("محصول یافت نشد");
  const movements = await prisma.inventoryMovement.findMany({
    where: { variantId: { in: product.variants.map((variant) => variant.id) } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return {
    ...product,
    basePrice: toToman(product.basePrice),
    salePrice: product.salePrice ? toToman(product.salePrice) : null,
    images: product.images.map((image) => ({ ...image })),
    variants: product.variants.map((variant) => ({
      ...variant,
      price: variant.price ? toToman(variant.price) : null,
    })),
    movements,
  };
}

export async function listAdminCategories() {
  return prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true, name: true, slug: true, description: true, image: true, icon: true,
      parentId: true, isActive: true, displayOrder: true,
      parent: { select: { name: true } },
      _count: { select: { products: true } },
    },
  });
}

export async function listBrands() {
  return prisma.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, isActive: true, _count: { select: { products: true } } } });
}

export async function createBrand(input: { name: string; slug: string; description?: string }) {
  if (await prisma.brand.findUnique({ where: { slug: input.slug } })) throw Errors.conflict("اسلاگ برند وجود دارد");
  return prisma.brand.create({ data: { ...input, description: input.description ?? null } });
}

export async function updateBrand(id: string, input: { name?: string; slug?: string; description?: string; isActive?: boolean }) {
  return prisma.brand.update({ where: { id }, data: input });
}

export async function deleteBrand(id: string) {
  const count = await prisma.product.count({ where: { brandId: id, isDeleted: false } });
  if (count) throw Errors.conflict("این برند دارای محصول است");
  await prisma.brand.delete({ where: { id } });
}

export async function listInventoryMovements(params: { page: number; pageSize: number; sku?: string }) {
  const where: Prisma.InventoryMovementWhereInput = params.sku
    ? { variant: { OR: [{ sku: { contains: params.sku } }, { product: { sku: { contains: params.sku } } }] } }
    : {};
  const [total, items] = await prisma.$transaction([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        variant: { select: { id: true, sku: true, size: true, color: true, stock: true, product: { select: { id: true, name: true, slug: true } } } },
        order: { select: { orderNumber: true } },
      },
    }),
  ]);
  return { items, total, page: params.page, pageCount: Math.max(1, Math.ceil(total / params.pageSize)) };
}

export async function listAdminReviews() {
  return prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { product: { select: { id: true, name: true, slug: true } }, user: { select: { phone: true, firstName: true, lastName: true } } },
  });
}

export async function moderateReview(id: string, isApproved: boolean, actorId: string) {
  const review = await prisma.review.update({ where: { id }, data: { isApproved } });
  await recalcProductRating(review.productId);
  await audit({ actorId, action: "review.moderated", entity: "Review", entityId: id, metadata: { isApproved } });
  return review;
}

export async function deleteReview(id: string, actorId: string) {
  const review = await prisma.review.findUnique({ where: { id }, select: { productId: true } });
  if (!review) throw Errors.notFound("نظر یافت نشد");
  await prisma.review.delete({ where: { id } });
  await recalcProductRating(review.productId);
  await audit({ actorId, action: "review.deleted", entity: "Review", entityId: id });
}

export async function getCustomerDetail(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, phone: true, firstName: true, lastName: true, email: true, isActive: true, role: true, createdAt: true, lastLogin: true,
      addresses: { select: { id: true, label: true, city: true, province: true, postalCode: true } },
      orders: { orderBy: { createdAt: "desc" }, take: 20, select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true } },
    },
  });
  if (!user) throw Errors.notFound("مشتری یافت نشد");
  return {
    ...user,
    orders: user.orders.map((order) => ({ ...order, total: toToman(order.totalAmount) })),
    spent: user.orders.reduce((sum, order) => sum + toToman(order.totalAmount), 0),
  };
}

export async function getSettings() {
  const config = await getSiteConfig();
  const rows = await prisma.siteSetting.findMany({ select: { key: true, value: true } });
  return { config, overrides: Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}

export async function updateSettings(input: SettingsInput, actorId: string) {
  const entries = Object.entries(input.settings).filter(([key]) =>
    (editableSettingKeys as readonly string[]).includes(key),
  );
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } }),
    ),
  );
  await audit({ actorId, action: "settings.updated", entity: "SiteSetting", metadata: { keys: entries.map(([k]) => k) } });
  invalidateCache("settings:");
  return getSettings();
}
