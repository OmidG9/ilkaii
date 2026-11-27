import { randomBytes } from "node:crypto";
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSiteConfig } from "@/config/site";
import { Errors } from "@/lib/errors";
import { calculateCoupon, orderTotals, shippingCost, toToman, toDecimalString } from "@/lib/money";
import { normalizeForSearch } from "@/lib/persian";
import { getCartView, restoreCartFromOrder } from "@/services/cart";
import { getPaymentProvider } from "@/services/payment";
import { recordAnalyticsEvent } from "@/services/analytics";
import { invalidateCache } from "@/lib/cache";
import { audit } from "@/lib/audit";
import type { CheckoutInput } from "@/services/types";

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentStatus: "PENDING" | "PAID";
  orderStatus: OrderStatus;
  redirectUrl?: string;
  message?: string;
}

function orderNumber(prefix = "ILK") {
  const clean = prefix.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase() || "ILK";
  return `${clean}-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
}

/** Rebuild a gateway URL for a payment whose first response may have been lost. */
export function paymentResumeUrl(provider: string, authority: string | null, orderId: string, total: number): string | undefined {
  if (!authority) return undefined;
  if (provider === "MOCK") {
    return `/api/payments/mock?order=${encodeURIComponent(orderId)}&amount=${total}`;
  }
  if (provider === "ZARINPAL") {
    const sandbox = process.env.ZARINPAL_SANDBOX === "true";
    return `https://${sandbox ? "sandbox." : "www."}zarinpal.com/pg/StartPay/${encodeURIComponent(authority)}`;
  }
  if (provider === "ZIBAL") {
    return `https://gateway.zibal.ir/start/${encodeURIComponent(authority)}`;
  }
  if (provider === "BEHPARDAKHT") {
    return `/api/payments/mellat/redirect?ref=${encodeURIComponent(authority)}`;
  }
  return undefined;
}

/** Undo coupon consumption when an order is cancelled or its payment fails. */
async function releaseCoupon(
  tx: Prisma.TransactionClient,
  order: { id: string; couponId: string | null },
) {
  if (!order.couponId) return;
  await tx.couponUsage.deleteMany({ where: { orderId: order.id } });
  await tx.coupon.updateMany({
    where: { id: order.couponId, usedCount: { gt: 0 } },
    data: { usedCount: { decrement: 1 } },
  });
}

/**
 * Server-authoritative checkout. Items, prices, discounts and shipping are
 * reloaded and recomputed here; client input may only select options.
 */
export async function createCheckout(
  input: CheckoutInput,
  userId: string,
  idempotencyKey: string,
  options: { analyticsSessionId?: string | null } = {},
): Promise<CheckoutResult> {
  const existing = await prisma.payment.findUnique({
    where: { idempotencyKey },
    include: {
      order: {
        select: {
          id: true, orderNumber: true, totalAmount: true, paymentStatus: true,
          status: true, userId: true,
        },
      },
    },
  });
  if (existing) {
    const order = existing.order;
    if (order.userId !== userId) throw Errors.conflict("کلید یکتای پرداخت نامعتبر است");

    if (existing.status === "FAILED" && order.status === "CANCELLED") {
      // The previous attempt was compensated (gateway error or cancelled
      // payment). Free the key so the same form can safely retry.
      await prisma.payment.update({ where: { id: existing.id }, data: { idempotencyKey: null } });
    } else {
      const total = toToman(order.totalAmount);
      const pendingPayment = existing.status === "PENDING" && order.status === "PENDING_PAYMENT";
      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total,
        paymentStatus: order.paymentStatus === "PAID" ? "PAID" : "PENDING",
        orderStatus: order.status,
        // If the first response was lost after the gateway session was created,
        // send the shopper back to the same payment instead of dead-ending.
        redirectUrl: pendingPayment
          ? paymentResumeUrl(existing.provider, existing.authority, order.id, total)
          : undefined,
        message: order.paymentStatus === "PAID" ? "این سفارش قبلاً پرداخت شده است" : "سفارش قبلاً ثبت شده است",
      };
    }
  }

  const cart = await getCartView();
  if (!cart.id || !cart.items.length) throw Errors.badRequest("سبد خرید خالی است");

  const site = await getSiteConfig();
  const isCod = input.paymentMethod === "COD";

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

    if (input.shippingMethod === "ALOPEYK" && !normalizeForSearch(addressSnapshot.city).includes(normalizeForSearch("تهران"))) {
      throw Errors.badRequest("الو پیک فقط برای شهر تهران فعال است");
    }

    const lines = freshItems.map((item) => {
      const product = item.product;
      if (product.isDeleted || product.status !== "ACTIVE") throw Errors.conflict(`محصول ${product.name} دیگر موجود نیست`);
      if (!item.variantId || !item.variant) {
        throw Errors.conflict(`برای ${product.name} سایز و رنگ انتخاب نشده است`);
      }
      if (item.variant.productId !== product.id) throw Errors.badRequest("تنوع نامعتبر است");
      if (!item.variant.isAvailable || item.variant.stock < item.quantity) {
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
      // Reserve a global usage slot atomically so concurrent checkouts cannot
      // exceed usageLimit. The increment is rolled back if the order fails.
      if (coupon!.usageLimit !== null) {
        const updated = await tx.coupon.updateMany({
          where: { id: coupon!.id, usedCount: { lt: coupon!.usageLimit } },
          data: { usedCount: { increment: 1 } },
        });
        if (!updated.count) throw Errors.badRequest("ظرفیت کد تخفیف تمام شده است");
      } else {
        await tx.coupon.update({ where: { id: coupon!.id }, data: { usedCount: { increment: 1 } } });
      }
      discount = calculation.discount;
      couponId = coupon!.id;
    }

    const ship = shippingCost(site.shipping, input.shippingMethod, subtotal);
    const totals = orderTotals({ subtotal, discount, shipping: ship });

    // COD orders are confirmed immediately (cash is collected on delivery), and
    // a fully discounted order needs no gateway session at all. Resolve the
    // gateway only for orders that actually need one.
    const isFree = !isCod && totals.total === 0;
    const gateway = !isCod && !isFree ? await getPaymentProvider(input.paymentGateway) : null;
    const initialStatus: OrderStatus = isCod ? "PROCESSING" : isFree ? "PAID" : "PENDING_PAYMENT";
    const initialPaymentStatus: "PENDING" | "PAID" = isFree ? "PAID" : "PENDING";

    const order = await tx.order.create({
      data: {
        orderNumber: orderNumber(site.store.orderPrefix),
        userId,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        paidAt: isFree ? new Date() : null,
        paymentMethod: input.paymentMethod,
        paymentGateway: isCod || isFree ? null : input.paymentGateway,
        shippingMethod: input.shippingMethod,
        ...addressSnapshot,
        subtotal: toDecimalString(totals.subtotal),
        discountAmount: toDecimalString(totals.discount),
        shippingCost: toDecimalString(totals.shipping),
        totalAmount: toDecimalString(totals.total),
        couponId,
        analyticsSessionId: options.analyticsSessionId ?? null,
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
        statusHistory: {
          create: {
            toStatus: initialStatus,
            note: isCod ? "سفارش ثبت شد؛ پرداخت هنگام تحویل" : isFree ? "سفارش با تخفیف کامل ثبت شد" : "سفارش ایجاد شد",
          },
        },
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
        provider: isCod ? "COD" : isFree ? "FREE" : gateway!.name,
        amount: toDecimalString(totals.total),
        // COD cash is collected on delivery; free orders are settled instantly.
        status: isFree ? "PAID" : "PENDING",
        idempotencyKey,
      },
    });

    if (couponId) {
      await tx.couponUsage.create({ data: { couponId, userId, orderId: order.id } });
    }
    await tx.cartItem.deleteMany({ where: { cartId: cart.id! } });
    await audit({
      actorId: userId, action: "order.created", entity: "Order", entityId: order.id,
      metadata: { orderNumber: order.orderNumber, total: totals.total },
    });

    return { order, totals, provider: gateway };
  });

  let redirectUrl: string | undefined;
  const isFree = !isCod && result.totals.total === 0;
  const provider = result.provider;
  if (provider && !isFree) {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    try {
      const initiated = await provider.initiate({
        orderId: result.order.id,
        orderNumber: result.order.orderNumber,
        amountToman: result.totals.total,
        callbackUrl: `${base}/api/payments/callback`,
      });
      await prisma.payment.updateMany({
        where: { orderId: result.order.id },
        data: { authority: initiated.authority },
      });
      redirectUrl = initiated.redirectUrl;
    } catch (error) {
      // The order transaction already committed; undo the reservation so stock
      // and the cart are not lost when the gateway cannot start a payment.
      await compensateInitiation(result.order.id, userId);
      throw error;
    }
  }

  if ((isCod || isFree) && options.analyticsSessionId) {
    await recordAnalyticsEvent({
      eventId: `purchase-${result.order.id}`,
      name: "purchase",
      path: "/checkout/result",
      metadata: { revenue: result.totals.total, orderId: result.order.id, orderNumber: result.order.orderNumber, method: isCod ? "COD" : "FREE" },
    }, {
      sessionId: options.analyticsSessionId,
      customerId: userId,
      consentGranted: true,
      serverEvent: true,
    });
  }

  invalidateCache("dashboard:");
  return {
    orderId: result.order.id,
    orderNumber: result.order.orderNumber,
    total: result.totals.total,
    paymentStatus: isFree ? "PAID" : "PENDING",
    orderStatus: result.order.status,
    redirectUrl,
  };
}

/** Restore a stock reservation when the payment gateway cannot be reached. */
async function compensateInitiation(orderId: string, actorId: string) {
  const compensated = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { status: true, paymentStatus: true, couponId: true },
    });
    if (!order || order.paymentStatus !== "PENDING") return false;

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
      data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: new Date() },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, fromStatus: order.status, toStatus: "CANCELLED", note: "آغاز پرداخت ناموفق" },
    });
    await releaseCoupon(tx, { id: orderId, couponId: order.couponId });
    await restoreCartFromOrder(actorId, orderId, tx);
    return true;
  });
  if (compensated) {
    await audit({ actorId, action: "payment.initiation_failed", entity: "Order", entityId: orderId });
    invalidateCache("dashboard:");
  }
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
    return {
      alreadyProcessed: true,
      order,
      requiresReview: payment.status === "REFUNDED" || order?.status === "CANCELLED" || order?.status === "REFUNDED",
    };
  }

  if (payment.status === "FAILED") {
    if (!params.success) {
      const order = await prisma.order.findUnique({ where: { id: payment.orderId }, select: { id: true, orderNumber: true, status: true } });
      return { alreadyProcessed: true, order, requiresReview: false };
    }
    // The gateway reports money captured after our order was already cancelled
    // (manual cancel, timeout or a transient earlier verification error). Never
    // discard that: record it and surface it for manual reconciliation/refund.
    const order = await prisma.order.findUnique({ where: { id: payment.orderId } });
    if (!order) throw Errors.notFound("سفارش یافت نشد");
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        reference: params.reference ?? null,
        rawResponse: params.rawResponse ? JSON.stringify(params.rawResponse) : null,
        failureReason: null,
      },
    });
    await audit({
      actorId: order.userId, action: "payment.confirmed_after_cancellation", entity: "Order",
      entityId: order.id, severity: "critical", metadata: { reference: params.reference },
    });
    return { alreadyProcessed: false, order, requiresReview: true };
  }

  const outcome = await prisma.$transaction(async (tx) => {
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
      data: { status: "CANCELLED", paymentStatus: "FAILED", cancelledAt: new Date() },
    });
    await tx.orderStatusHistory.create({ data: { orderId: current.id, fromStatus: current.status, toStatus: "CANCELLED", note: "پرداخت ناموفق" } });
    await releaseCoupon(tx, { id: current.id, couponId: current.couponId });
    // Give the shopper their cart back so they can retry or keep shopping.
    await restoreCartFromOrder(current.userId, current.id, tx);
    return updated;
  });

  if (params.success && outcome.analyticsSessionId) {
    await recordAnalyticsEvent({
      eventId: `purchase-${outcome.id}`,
      name: "purchase",
      path: "/checkout/result",
      metadata: { revenue: toToman(outcome.totalAmount), orderId: outcome.id, orderNumber: outcome.orderNumber, method: outcome.paymentMethod },
    }, {
      sessionId: outcome.analyticsSessionId,
      customerId: outcome.userId,
      consentGranted: true,
      serverEvent: true,
    });
  }
  invalidateCache("dashboard:");
  return { alreadyProcessed: false, order: outcome, requiresReview: false };
}

export async function cancelOrder(orderId: string, actorId: string | null, note?: string) {
  const cancelled = await prisma.$transaction(async (tx) => {
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
          reason: "CANCELLATION", note: note ?? (wasPaid ? "لغو سفارش" : "لغو سفارش پرداخت‌نشده"), userId: actorId,
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
      data: { orderId, fromStatus: order.status, toStatus: "CANCELLED", note: note ?? "لغو توسط مدیر", changedById: actorId },
    });
    // A coupon consumed by a successful payment stays consumed even if the
    // order is later cancelled/refunded. Failed/unpaid attempts release it.
    if (!wasPaid) await releaseCoupon(tx, { id: orderId, couponId: order.couponId });
    return { order, wasPaid };
  });

  await audit({ actorId, action: "order.cancelled", entity: "Order", entityId: orderId, metadata: { note } });
  // A COD purchase event was recorded at checkout, so cancellation must offset
  // it. Online orders only emit purchase after a successful payment.
  const { order, wasPaid } = cancelled;
  if (order.analyticsSessionId && (wasPaid || order.paymentMethod === "COD")) {
    await recordAnalyticsEvent({
      eventId: `refund-cancel-${order.id}`,
      name: "refund",
      path: "/admin/orders",
      metadata: { revenue: -toToman(order.totalAmount), orderId: order.id, orderNumber: order.orderNumber },
    }, {
      sessionId: order.analyticsSessionId,
      customerId: order.userId,
      consentGranted: true,
      serverEvent: true,
    });
  }
  invalidateCache("dashboard:");
}

/**
 * Release stock held by abandoned PENDING_PAYMENT orders. Older than 24h by
 * default, so a shopper still inside the gateway window is never cancelled.
 */
export async function expirePendingOrders(olderThanMinutes = 24 * 60, limit = 100) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", paymentStatus: "PENDING", createdAt: { lt: cutoff } },
    orderBy: { createdAt: "asc" },
    take: limit,
    select: { id: true },
  });
  let cancelled = 0;
  for (const order of stale) {
    try {
      await cancelOrder(order.id, null, "لغو خودکار سفارش پرداخت‌نشده");
      cancelled += 1;
    } catch {
      // A race with a successful payment is expected; leave the order intact.
    }
  }
  return { scanned: stale.length, cancelled };
}
