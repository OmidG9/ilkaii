import type { InventoryReason, OrderStatus, PaymentStatus, ReturnStatus, RoleCode } from "@prisma/client";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "در انتظار پرداخت",
  PAID: "پرداخت شده",
  PROCESSING: "در حال آمادهسازی",
  PACKED: "بستهبندی شده",
  SHIPPED: "ارسال شده",
  DELIVERED: "تحویل داده شده",
  CANCELLED: "لغو شده",
  REFUNDED: "بازپرداخت شده",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "در انتظار",
  PAID: "پرداخت شده",
  FAILED: "ناموفق",
  REFUNDED: "بازپرداخت شده",
};

export const returnStatusLabels: Record<ReturnStatus, string> = {
  PENDING: "در انتظار بررسی",
  APPROVED: "تأیید شده",
  REJECTED: "رد شده",
  COMPLETED: "تکمیل شده",
};

export const inventoryReasonLabels: Record<InventoryReason, string> = {
  SALE: "فروش",
  RESTOCK: "شارژ موجودی",
  ADJUSTMENT: "تنظیم دستی",
  RETURN: "بازگشت",
  CANCELLATION: "لغو سفارش",
};

export const roleLabels: Record<RoleCode, string> = {
  SUPER_ADMIN: "مدیرکل",
  ADMIN: "مدیر",
  ORDER_MANAGER: "مدیر سفارشها",
  PRODUCT_MANAGER: "مدیر محصول",
  CUSTOMER: "مشتری",
};
