import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { toToman } from "@/lib/money";
import type { z } from "zod";
import type { addressSchema, profileSchema, reviewSchema, returnSchema } from "@/lib/validation";

type AddressInput = z.infer<typeof addressSchema>;
type ProfileInput = z.infer<typeof profileSchema>;
type ReviewInput = z.infer<typeof reviewSchema>;
type ReturnInput = z.infer<typeof returnSchema>;

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, phone: true, firstName: true, lastName: true, email: true, avatar: true, createdAt: true, role: true },
  });
  if (!user) throw Errors.notFound("کاربر یافت نشد");
  return user;
}

export async function updateProfile(userId: string, input: ProfileInput) {
  return prisma.user.update({ where: { id: userId }, data: input, select: { id: true, phone: true, firstName: true, lastName: true, email: true } });
}

export async function listAddresses(userId: string) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
}

export async function createAddress(userId: string, input: AddressInput) {
  await prisma.$transaction(async (tx) => {
    if (input.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    await tx.address.create({ data: { ...input, userId } });
  });
  return listAddresses(userId);
}

export async function updateAddress(userId: string, addressId: string, input: Partial<AddressInput>) {
  const existing = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!existing) throw Errors.notFound("آدرس یافت نشد");
  await prisma.$transaction(async (tx) => {
    if (input.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    await tx.address.update({ where: { id: addressId }, data: input });
  });
  return listAddresses(userId);
}

export async function deleteAddress(userId: string, addressId: string) {
  const result = await prisma.address.deleteMany({ where: { id: addressId, userId } });
  if (!result.count) throw Errors.notFound("آدرس یافت نشد");
  return listAddresses(userId);
}

export async function listUserOrders(userId: string, page = 1, pageSize = 10) {
  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where: { userId } }),
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: { select: { productName: true, quantity: true, imageUrl: true, lineTotal: true } } },
    }),
  ]);
  return { items: orders.map((order) => ({ ...order, total: toToman(order.totalAmount), items: order.items.map((i) => ({ ...i, lineTotal: toToman(i.lineTotal) })) })), total, page, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getUserOrder(userId: string, orderNumber: string) {
  const order = await prisma.order.findFirst({
    where: { orderNumber, userId },
    include: {
      items: true,
      payments: { select: { provider: true, status: true, reference: true, createdAt: true } },
      shipments: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) throw Errors.notFound("سفارش یافت نشد");
  return {
    ...order,
    subtotal: toToman(order.subtotal),
    discount: toToman(order.discountAmount),
    shipping: toToman(order.shippingCost),
    total: toToman(order.totalAmount),
    items: order.items.map((item) => ({ ...item, unitPrice: toToman(item.unitPrice), lineTotal: toToman(item.lineTotal) })),
  };
}

export async function trackOrder(orderNumber: string, phone: string) {
  const order = await prisma.order.findFirst({
    where: { orderNumber, recipientPhone: phone },
    select: {
      orderNumber: true, status: true, createdAt: true, estimatedDelivery: true, trackingNumber: true,
      statusHistory: { orderBy: { createdAt: "asc" }, select: { toStatus: true, createdAt: true, note: true } },
    },
  });
  if (!order) throw Errors.notFound("سفارشی با این مشخصات یافت نشد");
  return order;
}

export async function listWishlist(userId: string) {
  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        select: {
          id: true, name: true, slug: true, basePrice: true, salePrice: true, availableStock: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return items.map((item) => ({
    id: item.id,
    productId: item.product.id,
    slug: item.product.slug,
    name: item.product.name,
    price: item.product.salePrice && toToman(item.product.salePrice) < toToman(item.product.basePrice)
      ? toToman(item.product.salePrice) : toToman(item.product.basePrice),
    image: item.product.images[0]?.url ?? null,
    available: item.product.availableStock > 0,
  }));
}

export async function toggleWishlist(userId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, isDeleted: false, status: "ACTIVE" }, select: { id: true } });
  if (!product) throw Errors.notFound("محصول یافت نشد");
  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } }, select: { id: true },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return { added: false };
  }
  await prisma.wishlistItem.create({ data: { userId, productId } });
  return { added: true };
}

export async function createReview(userId: string, input: ReviewInput) {
  const purchased = await prisma.orderItem.count({
    where: {
      productId: input.productId,
      order: { userId, status: { in: ["DELIVERED", "SHIPPED", "PACKED"] } },
    },
  });
  if (!purchased) throw Errors.forbidden("فقط مشتریانی که این محصول را خریداری کردهاند میتوانند نظر ثبت کنند");
  const review = await prisma.review.upsert({
    where: { userId_productId: { userId, productId: input.productId } },
    update: { rating: input.rating, title: input.title ?? null, comment: input.comment, isApproved: false },
    create: { userId, productId: input.productId, rating: input.rating, title: input.title ?? null, comment: input.comment, isVerified: true },
  });
  return review;
}

export async function listProductReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, isApproved: true },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, rating: true, title: true, comment: true, createdAt: true, user: { select: { firstName: true, lastName: true } } },
  });
}

export async function listUserReviews(userId: string) {
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { product: { select: { id: true, name: true, slug: true } } },
  });
  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    isApproved: review.isApproved,
    createdAt: review.createdAt,
    product: review.product,
  }));
}

export async function createReturn(userId: string, input: ReturnInput) {
  const order = await prisma.order.findFirst({ where: { id: input.orderId, userId } });
  if (!order) throw Errors.notFound("سفارش یافت نشد");
  if (!["DELIVERED", "SHIPPED"].includes(order.status)) throw Errors.badRequest("امکان درخواست بازگشت برای این سفارش وجود ندارد");
  await audit({ actorId: userId, action: "return.requested", entity: "Order", entityId: order.id });
  return prisma.returnRequest.create({ data: { orderId: order.id, userId, reason: input.reason } });
}

export async function listMyReturns(userId: string) {
  return prisma.returnRequest.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, include: { order: { select: { orderNumber: true, status: true } } } });
}
