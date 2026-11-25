import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { getSiteConfig } from "@/config/site";
import { Errors } from "@/lib/errors";
import { calculateCoupon, orderTotals, shippingCost, toToman, toDecimalString } from "@/lib/money";
import { getCartView } from "@/services/cart";
import { getPaymentProvider } from "@/services/payment";
import { audit } from "@/lib/audit";
import type { CheckoutInput } from "@/services/types";

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentStatus: "PENDING" | "PAID";
  redirectUrl?: string;
  message?: string;
}

function orderNumber() {
  return `ILK-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/**
 * Server-authoritative checkout. Items, prices, discounts and shipping are
 * reloaded and recomputed here; client input may only select options.
 */
export async function createCheckout(input: CheckoutInput, userId: string, idempotencyKey: string): Promise<CheckoutResult> {
  const existing = await prisma.payment.findUnique({ where: { idempotencyKey } });
  if (existing) {
    const order = await prisma.order.findUnique({ where: { id: existing.orderId }, select: { id: true, orderNumber: true, totalAmount: true, paymentStatus: true } });
    if (order) {
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: toToman(order.totalAmount),
        paymentStatus: order.paymentStatus === "PAID" ? "PAID" : "PENDING",
        message: "سفارش قبلاً ثبت شده است",
      };
    }
  }

  const cart = await getCartView();
  if (!cart.id || !cart.items.length) throw Errors.badRequest("سبد خرید خالی است");

  const site = await getSiteConfig();
  const provider = input.paymentMethod === "COD" ? null : getPaymentProvider();

  const result = await prisma.$transaction(async (tx) => {
    const freshItems = await tx.cartItem.findMany({
      where: { cartId: cart.id! },
      include: {
        product: { select: { id: true, name: true, slug: true, basePrice: true, salePrice: true, isDeleted: true, status: true, images: { where: { isPrimary: true }, take: 1, select: { url: true } } } },
        variant: { select: { id: true, size: true, color: true, sku: true, stock: true, isAvailable: true, price: true, productId: true } },
      },
    });
    if (!freshItems.length) throw Errors.badRequest("سبد خرید خالی است");

    let addressSnapshot: {
      recipientName: string; recipientPhone: string; province: string; city: string; street: string; postalCode: string;
    };
    if (input.addressId) {
      const address = await tx.address.findFirst({ where: { id: input.addressId, userId } });
      if (!address) throw Errors.forbidden("آدرس انتخاب شده متعلق به شما نیست");
      addressSnapshot = {
        recipientName: address.fullName, recipientPhone: address.phone, province: address.province,
        city: address.city, street: address.street, postalCode: address.postalCode,
      };
    } else if (input.address) {
      const a = input.address;
      await tx.address.create({
        data: {
          userId, label: a.label, fullName: a.fullName, phone: a.phone, province: a.province,
          city: a.city, street: a.street, postalCode: a.postalCode, isDefault: a.isDefault,
        },
      });
      addressSnapshot = {
        recipientName: a.fullName, recipientPhone: a.phone, province: a.province,
        city: a.city, street: a.street, postalCode: a.postalCode,
      };
    } else {
      throw Errors.badRequest("آدرس تحویل الزامی است");
    }

    const lines = freshItems.map((item) => {
      const product = item.product;
      if (product.isDeleted || product.status !== "ACTIVE") throw Errors.conflict(`محصول ${product.name} دیگر موجود نیست`);
      if (item.variantId && (!item.variant || item.variant.productId !== product.id)) {
        throw Errors.badRequest("تنوع نامعتبر است");
      }
      if (item.variant && (!item.variant.isAvailable || item.variant.stock < item.quantity)) {
        throw Errors.conflict(`موجودی ${product.name} کافی نیست`);
      }
      const base = toToman(product.basePrice);
      const sale = product.salePrice ? toToman(product.salePrice) : null;
      const unitPrice = item.variant?.price
        ? toToman(item.variant.price)
        : (sale !== null && sale > 0 && sale < base ? sale : base);
      return { item, product, unitPrice, lineTotal: unitPrice * item.quantity };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);

    let couponId: string | null = null;
    let discount = 0;
    if (input.couponCode && site.features.coupons) {
      const coupon = await tx.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
      const calculation = calculateCoupon(coupon, subtotal);
      if (!calculation.valid) throw Errors.badRequest(calculation.reason ?? "کد تخفیف نامعتبر است");
      if (coupon!.perUserLimit) {
        const used = await tx.couponUsage.count({ where: { couponId: coupon!.id, userId } });
        if (used >= coupon!.perUserLimit) throw Errors.badRequest("شما از این کد تخفیف حداکثر استفاده را کردهاید");
      }
      discount = calculation.discount;
      couponId = coupon!.id;
    }

    const ship = shippingCost(site.shipping, input.shippingMethod, subtotal);
    const totals = orderTotals({ subtotal, discount, shipping: ship });

    const order = await tx.order.create({
      data: {
        orderNumber: orderNumber(),
        userId,
        status: "PENDING_PAYMENT",
        paymentStatus: input.paymentMethod === "COD" ? "PAID" : "PENDING",
        paymentMethod: input.paymentMethod,
        shippingMethod: input.shippingMethod,
        ...addressSnapshot,
        subtotal: toDecimalString(totals.subtotal),
        discountAmount: toDecimalString(totals.discount),
        shippingCost: toDecimalString(totals.shipping),
        totalAmount: toDecimalString(totals.total),
        couponId,
        items: {
          create: lines.map((line) => ({
            productId: line.product.id,
            variantId: line.item.variantId,
            productName: line.product.name,
            variantName: line.item.variant ? [line.item.variant.size, line.item.variant.color].filter(Boolean).join(" / ") : null,
            sku: line.item.variant?.sku ?? "N/A",
            imageUrl: line.product.images[0]?.url ?? null,
            unitPrice: toDecimalString(line.unitPrice),
            quantity: line.item.quantity,
            lineTotal: toDecimalString(line.lineTotal),
          })),
        },
        statusHistory: { create: { toStatus: "PENDING_PAYMENT", note: "سفارش ایجاد شد" } },
      },
    });

    for (const line of lines) {
      if (!line.item.variantId) continue;
      const updated = await tx.productVariant.updateMany({
        where: { id: line.item.variantId, stock: { gte: line.item.quantity } },
        data: { stock: { decrement: line.item.quantity } },
      });
      if (!updated.count) throw Errors.conflict(`موجودی ${line.product.name} تغییر کرده است`);
      await tx.inventoryMovement.create({
        data: {
          variantId: line.item.variantId, orderId: order.id, quantity: -line.item.quantity,
          reason: "SALE", note: `سفارش ${order.orderNumber}`, userId,
        },
      });
      const sum = await tx.productVariant.aggregate({
        where: { productId: line.product.id }, _sum: { stock: true },
      });
      await tx.product.update({
        where: { id: line.product.id },
        data: { totalStock: sum._sum.stock ?? 0, availableStock: sum._sum.stock ?? 0 },
      });
    }

    await tx.payment.create({
      data: {
        orderId: order.id,
        provider: input.paymentMethod === "COD" ? "COD" : provider!.name,
        amount: toDecimalString(totals.total),
        status: input.paymentMethod === "COD" ? "PAID" : "PENDING",
        idempotencyKey,
      },
    });

    if (couponId) {
      await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      await tx.couponUsage.create({ data: { couponId, userId, orderId: order.id } });
    }
    await tx.cartItem.deleteMany({ where: { cartId: cart.id! } });
    await audit({
      actorId: userId, action: "order.created", entity: "Order", entityId: order.id,
      metadata: { orderNumber: order.orderNumber, total: totals.total },
    });

    return { order, totals };
  });

  let redirectUrl: string | undefined;
  if (provider) {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    try {
      const initiated = await provider.initiate({
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        amountToman: result.totals.total,
        callbackUrl: `${base}/api/payments/callback?provider=${provider.name}`,
      });
      await prisma.payment.updateMany({
        where: { orderId: result.order.id },
        data: { authority: initiated.authority },
      });
      redirectUrl = initiated.redirectUrl;
    } catch (error) {
      // The order transaction already committed; undo the reservation so stock
      // is not lost when the gateway cannot start a payment session.
      await compensateInitiation(result.order.id, userId);
      throw error;
    }
  }

  return {
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    total: result.totals.total,
    paymentStatus: input.paymentMethod === "COD" ? "PAID" : "PENDING",
    redirectUrl,
  };
}

/** Restore a stock reservation when the payment gateway cannot be reached. */
async function compensateInitiation(orderId: string, actorId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, paymentStatus: true },
    });
    if (!order || order.paymentStatus !== "PENDING") return;

    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { variantId: true, quantity: true },
    });
    for (const item of items) {
      if (!item.variantId) continue;
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
      await tx.inventoryMovement.create({
        data: {
          variantId: item.variantId, orderId, quantity: item.quantity,
          reason: "CANCELLATION", note: "آغاز پرداخت ناموفق", userId: actorId,
        },
      });
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { productId: true },
      });
      if (variant) {
        const sum = await tx.productVariant.aggregate({
          where: { productId: variant.productId }, _sum: { stock: true },
        });
        await tx.product.update({
          where: { id: variant.productId },
          data: { totalStock: sum._sum.stock ?? 0, availableStock: sum._sum.stock ?? 0 },
        });
      }
    }
    await tx.payment.updateMany({
      where: { orderId },
      data: { status: "FAILED", failureReason: "آغاز پرداخت ناموفق بود" },
    });
    await tx.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus: "CANCELLED", note: "آغاز پرداخت ناموفق" },
    });
    await audit({ actorId, action: "payment.initiation_failed", entity: "Order", entityId: orderId });
  });
}

/**
 * Idempotent payment finalization. A replayed callback never changes state or
 * inventory twice. Failures restore stock transactionally.
 */
export async function finalizePayment(params: {
  authority: string;
  success: boolean;
  reference?: string;
  rawResponse?: unknown;
}) {
  const payment = await prisma.payment.findUnique({ where: { authority: params.authority } });
  if (!payment) throw Errors.notFound("پرداخت یافت نشد");
  if (payment.status === "PAID" || payment.status === "REFUNDED") {
    const order = await prisma.order.findUnique({ where: { id: payment.orderId }, select: { id: true, orderNumber: true, status: true } });
    return { alreadyProcessed: true, order };
  }
  if (payment.status === "FAILED" && params.success) {
    throw Errors.conflict("این پرداخت قبلاً ناموفق بوده است");
  }

  const order = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { id: payment.orderId } });
    if (!current || current.paymentStatus !== "PENDING") {
      throw Errors.conflict("وضعیت سفارش قابل تغییر نیست");
    }
    if (toToman(payment.amount) !== toToman(current.totalAmount)) {
      throw Errors.conflict("مبلغ پرداخت با سفارش مطابقت ندارد");
    }

    if (params.success) {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "PAID", reference: params.reference ?? null,
          rawResponse: params.rawResponse ? JSON.stringify(params.rawResponse) : null,
        },
      });
      const updated = await tx.order.update({
        where: { id: current.id },
        data: { status: "PAID", paymentStatus: "PAID", paidAt: new Date() },
      });
      await tx.orderStatusHistory.create({ data: { orderId: current.id, fromStatus: current.status, toStatus: "PAID", note: "پرداخت تأیید شد" } });
      await audit({ actorId: current.userId, action: "payment.confirmed", entity: "Order", entityId: current.id, metadata: { reference: params.reference } });
      return updated;
    }

    const items = await tx.orderItem.findMany({ where: { orderId: current.id }, select: { variantId: true, quantity: true } });
    for (const item of items) {
      if (!item.variantId) continue;
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
      await tx.inventoryMovement.create({
        data: { variantId: item.variantId, orderId: current.id, quantity: item.quantity, reason: "CANCELLATION", note: "پرداخت ناموفق" },
      });
      const variant = await tx.productVariant.findUnique({ where: { id: item.variantId }, select: { productId: true } });
      if (variant) {
        const sum = await tx.productVariant.aggregate({ where: { productId: variant.productId }, _sum: { stock: true } });
        await tx.product.update({ where: { id: variant.productId }, data: { totalStock: sum._sum.stock ?? 0, availableStock: sum._sum.stock ?? 0 } });
      }
    }
    await tx.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: "پرداخت ناموفق یا لغو شد" } });
    const updated = await tx.order.update({
      where: { id: current.id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    await tx.orderStatusHistory.create({ data: { orderId: current.id, fromStatus: current.status, toStatus: "CANCELLED", note: "پرداخت ناموفق" } });
    return updated;
  });
  return { alreadyProcessed: false, order };
}

export async function cancelOrder(orderId: string, actorId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw Errors.notFound("سفارش یافت نشد");
    if (["DELIVERED", "SHIPPED", "CANCELLED", "REFUNDED"].includes(order.status)) {
      throw Errors.conflict("این سفارش قابل لغو نیست");
    }

    const wasPaid = order.paymentStatus === "PAID";
    // Every cancellable order reserved stock at checkout (paid or pending), so
    // inventory is always restored here.
    const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
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
          variantId: item.variantId, orderId, quantity: item.quantity,
          reason: "CANCELLATION", note: wasPaid ? "لغو سفارش" : "لغو سفارش پرداخت‌نشده", userId: actorId,
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

    await tx.payment.updateMany({
      where: { orderId },
      data: { status: wasPaid ? "REFUNDED" : "FAILED" },
    });
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED", cancelledAt: new Date(),
        paymentStatus: wasPaid ? "REFUNDED" : "FAILED",
      },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus: "CANCELLED", note: "لغو توسط مدیر", changedById: actorId },
    });
    await audit({ actorId, action: "order.cancelled", entity: "Order", entityId: orderId });
  });
}
