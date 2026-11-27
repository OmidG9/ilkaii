import type { z } from "zod";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { toDecimalString, toToman } from "@/lib/money";
import { notifyOrder } from "@/services/messaging";
import { recordAnalyticsEvent } from "@/services/analytics";
import type { refundSchema } from "@/lib/validation";

export type RefundInput = z.infer<typeof refundSchema>;

/**
 * Manual/gateway-independent refund ledger. Operators record the bank
 * reference after performing the refund at the provider. Partial refunds keep
 * the order active until completed refunds cover the paid amount.
 */
export async function registerRefund(orderId: string, input: RefundInput, actorId: string) {
  const result = await prisma.$transaction(async (tx) => {
    // Serialize refunds for the same order so two operators cannot both pass
    // the remaining-amount check and over-refund it.
    await tx.$queryRaw`SELECT id FROM \`Order\` WHERE id = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        userId: true,
        totalAmount: true,
        paymentStatus: true,
        status: true,
        analyticsSessionId: true,
        payments: {
          where: { status: { in: ["PAID", "REFUNDED"] } },
          orderBy: { createdAt: "desc" },
          select: { id: true, status: true },
        },
        refunds: { where: { status: "COMPLETED" }, select: { amount: true } },
      },
    });
    if (!order) throw Errors.notFound("سفارش یافت نشد");
    if (order.paymentStatus !== "PAID" && order.paymentStatus !== "REFUNDED") {
      throw Errors.conflict("برای این سفارش پرداختی ثبت نشده است");
    }

    const total = toToman(order.totalAmount);
    const alreadyRefunded = order.refunds.reduce((sum, refund) => sum + toToman(refund.amount), 0);
    if (input.status === "COMPLETED" && alreadyRefunded + input.amount > total) {
      throw Errors.conflict(`حداکثر مبلغ قابل بازپرداخت ${Math.max(0, total - alreadyRefunded)} تومان است`);
    }

    const payment = input.paymentId
      ? order.payments.find((row) => row.id === input.paymentId)
      : order.payments.find((row) => row.status === "PAID") ?? order.payments[0] ?? null;
    if (input.paymentId && !payment) throw Errors.badRequest("پرداخت انتخاب‌شده متعلق به این سفارش نیست");

    const refund = await tx.refund.create({
      data: {
        orderId,
        paymentId: payment?.id ?? null,
        amount: toDecimalString(input.amount),
        reason: input.reason ?? null,
        reference: input.reference ?? null,
        status: input.status,
        actorId,
        completedAt: input.status === "COMPLETED" ? new Date() : null,
      },
    });

    const fullyRefunded = input.status === "COMPLETED" && alreadyRefunded + input.amount >= total;
    if (fullyRefunded) {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
      });
      await tx.payment.updateMany({ where: { orderId }, data: { status: "REFUNDED" } });
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: "REFUNDED",
          note: `بازپرداخت ${input.amount} تومان ثبت شد`,
          changedById: actorId,
        },
      });
    }

    return { refund, fullyRefunded, orderNumber: order.orderNumber, analyticsSessionId: order.analyticsSessionId };
  });

  await audit({
    actorId,
    action: "refund.registered",
    entity: "Order",
    entityId: orderId,
    severity: "warn",
    metadata: {
      amount: input.amount,
      status: input.status,
      fullyRefunded: result.fullyRefunded,
      reference: input.reference ?? null,
    },
  });

  if (input.status === "COMPLETED") {
    if (result.analyticsSessionId) {
      await recordAnalyticsEvent({
        eventId: `refund-${result.refund.id}`,
        name: "refund",
        path: "/admin/orders",
        metadata: { revenue: -input.amount, orderId, orderNumber: result.orderNumber },
      }, {
        sessionId: result.analyticsSessionId,
        consentGranted: true,
        serverEvent: true,
      });
    }
    void notifyOrder(orderId, "REFUNDED", { amount: input.amount });
  }
  return result.refund;
}
