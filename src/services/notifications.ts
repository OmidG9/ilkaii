import { prisma } from "@/lib/db";
import type { AdminNotification } from "@/lib/admin-navigation";
import { formatJalali } from "@/lib/persian";
import { lowStockVariants } from "@/services/catalog";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Operational notifications are derived from real records. They are never
 * persisted as a separate read/unread stream, so they cannot become stale.
 */
export async function getAdminNotifications(permissions: readonly string[]): Promise<AdminNotification[]> {
  const canOrders = permissions.includes("orders.view") || permissions.includes("order.read");
  const canProducts = permissions.includes("products.view") || permissions.includes("product.read");
  const canSystem = permissions.includes("system.view");

  const [newOrders, pendingReturns, lowStock, failedPayments, failedJobs] = await Promise.all([
    canOrders
      ? prisma.order.findMany({
          where: { createdAt: { gte: new Date(Date.now() - 7 * DAY) } },
          orderBy: { createdAt: "desc" },
          take: 4,
          select: { id: true, orderNumber: true, totalAmount: true, createdAt: true, status: true },
        })
      : [],
    canOrders
      ? prisma.returnRequest.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 3, select: { id: true, createdAt: true, order: { select: { orderNumber: true } } } })
      : [],
    canProducts
      ? lowStockVariants().then((rows) => rows.slice(0, 3))
      : [],
    canSystem
      ? prisma.payment.findMany({ where: { status: "FAILED", createdAt: { gte: new Date(Date.now() - DAY) } }, take: 3, orderBy: { createdAt: "desc" }, select: { id: true, orderId: true, createdAt: true, failureReason: true } })
      : [],
    canSystem
      ? prisma.backgroundJob.findMany({ where: { status: "FAILED" }, take: 3, orderBy: { createdAt: "desc" }, select: { id: true, name: true, createdAt: true, error: true } })
      : [],
  ]);

  const notifications: AdminNotification[] = [];

  for (const order of newOrders) {
    notifications.push({
      id: `order-${order.id}`,
      title: `سفارش ${order.orderNumber}`,
      description: `${order.status === "PENDING_PAYMENT" ? "در انتظار پرداخت" : "ثبت شده"} — ${formatJalali(order.createdAt, true)}`,
      href: `/admin/orders/${order.id}`,
      tone: order.status === "PENDING_PAYMENT" ? "warning" : "info",
      createdAt: order.createdAt.toISOString(),
    });
  }
  for (const request of pendingReturns) {
    notifications.push({
      id: `return-${request.id}`,
      title: "درخواست مرجوعی در انتظار بررسی",
      description: `سفارش ${request.order.orderNumber}`,
      href: "/admin/returns",
      tone: "warning",
      createdAt: request.createdAt.toISOString(),
    });
  }
  for (const variant of lowStock) {
    notifications.push({
      id: `stock-${variant.id}`,
      title: `موجودی کم: ${variant.product.name}`,
      description: `${variant.sku} — ${variant.stock} عدد باقی مانده`,
      href: `/admin/products/${variant.product.id}`,
      tone: variant.stock === 0 ? "danger" : "warning",
    });
  }
  for (const payment of failedPayments) {
    notifications.push({
      id: `payment-${payment.id}`,
      title: "پرداخت ناموفق",
      description: payment.failureReason ?? "خطا در تأیید پرداخت",
      href: `/admin/orders/${payment.orderId}`,
      tone: "danger",
      createdAt: payment.createdAt.toISOString(),
    });
  }
  for (const job of failedJobs) {
    notifications.push({
      id: `job-${job.id}`,
      title: `کار پس‌زمینه ناموفق: ${job.name}`,
      description: job.error?.slice(0, 120) ?? "بدون جزئیات",
      href: "/admin/system",
      tone: "danger",
      createdAt: job.createdAt.toISOString(),
    });
  }

  return notifications.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).slice(0, 14);
}

export interface AdminBadges {
  orders: number;
  returns: number;
}

export async function getAdminBadges(permissions: readonly string[]): Promise<AdminBadges> {
  if (!permissions.includes("orders.view") && !permissions.includes("order.read")) {
    return { orders: 0, returns: 0 };
  }
  const [orders, returns] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["PENDING_PAYMENT", "PAID", "PROCESSING"] } } }),
    prisma.returnRequest.count({ where: { status: "PENDING" } }),
  ]);
  return { orders, returns };
}
