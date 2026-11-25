import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { toToman } from "@/lib/money";
import { roleLabel } from "@/lib/permissions";

const num = (value: unknown): number => Number(value ?? 0);

export const VIP_SPEND = 5_000_000;
export const HIGH_VALUE_SPEND = 3_000_000;

export const CUSTOMER_SEGMENTS = [
  { key: "new", label: "مشتری جدید" },
  { key: "returning", label: "مشتری بازگشتی" },
  { key: "vip", label: "مشتری VIP" },
  { key: "high-value", label: "ارزش بالا" },
  { key: "inactive", label: "غیرفعال" },
  { key: "cart-abandoner", label: "سبد رهاشده" },
  { key: "frequent-cancellations", label: "لغو مکرر" },
] as const;

export type CustomerSegmentKey = (typeof CUSTOMER_SEGMENTS)[number]["key"];

export interface CustomerRow {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  isActive: boolean;
  role: string;
  createdAt: Date;
  lastActivity: Date | null;
  orders: number;
  paidOrders: number;
  cancelledOrders: number;
  spent: number;
  lastPurchase: Date | null;
  cartItems: number;
  segments: CustomerSegmentKey[];
}

interface RawCustomerRow {
  id: string; phone: string; firstName: string | null; lastName: string | null; email: string | null;
  isActive: number | boolean; role: string; createdAt: Date; lastActivity: Date | string | null;
  orderCount: unknown; paidOrders: unknown; cancelledOrders: unknown; spent: unknown;
  lastPurchase: Date | string | null; cartItems: unknown;
}

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function segmentsFor(row: RawCustomerRow): CustomerSegmentKey[] {
  return classifyCustomerSegments({
    createdAt: toDate(row.createdAt) ?? new Date(0),
    lastActivity: toDate(row.lastActivity),
    paidOrders: num(row.paidOrders),
    spent: num(row.spent),
    cartItems: num(row.cartItems),
    lastPurchase: toDate(row.lastPurchase),
    cancelledOrders: num(row.cancelledOrders),
  });
}

/** Pure segmentation used by both the list and the customer profile. */
export function classifyCustomerSegments(input: {
  createdAt: Date;
  lastActivity: Date | null;
  paidOrders: number;
  spent: number;
  cartItems: number;
  lastPurchase: Date | null;
  cancelledOrders: number;
}, now = new Date()): CustomerSegmentKey[] {
  const segments: CustomerSegmentKey[] = [];
  const current = now.getTime();
  const lastActivity = input.lastActivity ?? input.createdAt;
  const ms30 = 30 * 24 * 60 * 60 * 1000;
  const ms90 = 90 * 24 * 60 * 60 * 1000;
  const ms7 = 7 * 24 * 60 * 60 * 1000;
  if (input.paidOrders === 0 && current - input.createdAt.getTime() <= ms30) segments.push("new");
  if (input.paidOrders >= 2) segments.push("returning");
  if (input.spent >= VIP_SPEND) segments.push("vip");
  if (input.spent >= HIGH_VALUE_SPEND && input.spent < VIP_SPEND) segments.push("high-value");
  if (current - lastActivity.getTime() > ms90) segments.push("inactive");
  if (input.cartItems > 0 && (!input.lastPurchase || current - input.lastPurchase.getTime() > ms7)) segments.push("cart-abandoner");
  if (input.cancelledOrders >= 2) segments.push("frequent-cancellations");
  return segments;
}

function havingForSegment(segment: CustomerSegmentKey): Prisma.Sql {
  switch (segment) {
    case "new": return Prisma.sql`paidOrders = 0 AND u.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    case "returning": return Prisma.sql`paidOrders >= 2`;
    case "vip": return Prisma.sql`spent >= ${VIP_SPEND}`;
    case "high-value": return Prisma.sql`spent >= ${HIGH_VALUE_SPEND} AND spent < ${VIP_SPEND}`;
    case "inactive": return Prisma.sql`COALESCE(u.lastActivityAt, u.lastLogin, u.createdAt) < DATE_SUB(NOW(), INTERVAL 90 DAY)`;
    case "cart-abandoner": return Prisma.sql`cartItems > 0 AND (lastPurchase IS NULL OR lastPurchase < DATE_SUB(NOW(), INTERVAL 7 DAY))`;
    case "frequent-cancellations": return Prisma.sql`cancelledOrders >= 2`;
    default: return Prisma.sql`1=1`;
  }
}

export interface CustomerFilter {
  page: number;
  pageSize: number;
  q?: string;
  segment?: CustomerSegmentKey;
  minSpend?: number;
  maxSpend?: number;
  minOrders?: number;
  maxOrders?: number;
  registeredFrom?: Date;
  registeredTo?: Date;
  purchaseFrom?: Date;
  purchaseTo?: Date;
  activitySince?: Date;
  sort?: "newest" | "spend" | "orders" | "activity";
}

export async function listCustomers(params: CustomerFilter) {
  const conditions: Prisma.Sql[] = [Prisma.sql`u.role = 'CUSTOMER'`];
  if (params.q) {
    const like = `%${params.q}%`;
    conditions.push(Prisma.sql`(u.phone LIKE ${like} OR u.firstName LIKE ${like} OR u.lastName LIKE ${like} OR u.email LIKE ${like})`);
  }
  if (params.registeredFrom) conditions.push(Prisma.sql`u.createdAt >= ${params.registeredFrom}`);
  if (params.registeredTo) conditions.push(Prisma.sql`u.createdAt <= ${params.registeredTo}`);
  if (params.activitySince) conditions.push(Prisma.sql`COALESCE(u.lastActivityAt, u.lastLogin, u.createdAt) >= ${params.activitySince}`);
  if (params.purchaseFrom || params.purchaseTo) {
    const from = params.purchaseFrom ?? new Date(0);
    const to = params.purchaseTo ?? new Date();
    conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM \`Order\` po WHERE po.userId = u.id AND po.paymentStatus = 'PAID' AND po.createdAt BETWEEN ${from} AND ${to})`);
  }

  const having: Prisma.Sql[] = [];
  if (params.segment) having.push(havingForSegment(params.segment));
  if (params.minSpend !== undefined) having.push(Prisma.sql`spent >= ${params.minSpend}`);
  if (params.maxSpend !== undefined) having.push(Prisma.sql`spent <= ${params.maxSpend}`);
  if (params.minOrders !== undefined) having.push(Prisma.sql`paidOrders >= ${params.minOrders}`);
  if (params.maxOrders !== undefined) having.push(Prisma.sql`paidOrders <= ${params.maxOrders}`);

  const where = Prisma.join(conditions, " AND ");
  const havingSql = having.length ? Prisma.sql`HAVING ${Prisma.join(having, " AND ")}` : Prisma.empty;
  const orderBy =
    params.sort === "spend" ? Prisma.sql`spent DESC` :
    params.sort === "orders" ? Prisma.sql`paidOrders DESC` :
    params.sort === "activity" ? Prisma.sql`lastActivity DESC` :
    Prisma.sql`u.createdAt DESC`;
  const offset = (params.page - 1) * params.pageSize;

  const rows = await prisma.$queryRaw<RawCustomerRow[]>(Prisma.sql`
    SELECT u.id, u.phone, u.firstName, u.lastName, u.email, u.isActive, u.role, u.createdAt,
           COALESCE(u.lastActivityAt, u.lastLogin, u.createdAt) AS lastActivity,
           COUNT(DISTINCT o.id) AS orderCount,
           COUNT(DISTINCT CASE WHEN o.paymentStatus='PAID' THEN o.id END) AS paidOrders,
           COUNT(DISTINCT CASE WHEN o.status='CANCELLED' THEN o.id END) AS cancelledOrders,
           CAST(COALESCE(SUM(CASE WHEN o.paymentStatus='PAID' THEN o.totalAmount ELSE 0 END),0) AS SIGNED) AS spent,
           MAX(CASE WHEN o.paymentStatus='PAID' THEN o.createdAt END) AS lastPurchase,
           (SELECT COUNT(*) FROM CartItem ci JOIN Cart c ON c.id=ci.cartId WHERE c.userId=u.id) AS cartItems
    FROM \`User\` u LEFT JOIN \`Order\` o ON o.userId=u.id
    WHERE ${where}
    GROUP BY u.id, u.phone, u.firstName, u.lastName, u.email, u.isActive, u.role, u.createdAt, u.lastActivityAt, u.lastLogin
    ${havingSql}
    ORDER BY ${orderBy}
    LIMIT ${params.pageSize} OFFSET ${offset}`);

  const countRows = await prisma.$queryRaw<Array<{ total: unknown }>>(Prisma.sql`
    SELECT COUNT(*) AS total FROM (
      SELECT u.id,
             COUNT(DISTINCT o.id) AS orderCount,
             COUNT(DISTINCT CASE WHEN o.paymentStatus='PAID' THEN o.id END) AS paidOrders,
             COUNT(DISTINCT CASE WHEN o.status='CANCELLED' THEN o.id END) AS cancelledOrders,
             CAST(COALESCE(SUM(CASE WHEN o.paymentStatus='PAID' THEN o.totalAmount ELSE 0 END),0) AS SIGNED) AS spent,
             MAX(CASE WHEN o.paymentStatus='PAID' THEN o.createdAt END) AS lastPurchase,
             (SELECT COUNT(*) FROM CartItem ci JOIN Cart c ON c.id=ci.cartId WHERE c.userId=u.id) AS cartItems
      FROM \`User\` u LEFT JOIN \`Order\` o ON o.userId=u.id
      WHERE ${where}
      GROUP BY u.id, u.phone, u.firstName, u.lastName, u.email, u.isActive, u.role, u.createdAt, u.lastActivityAt, u.lastLogin
      ${havingSql}
    ) t`);

  const items: CustomerRow[] = rows.map((row) => ({
    id: row.id,
    phone: row.phone,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    isActive: Boolean(row.isActive),
    role: row.role,
    createdAt: toDate(row.createdAt) ?? new Date(),
    lastActivity: toDate(row.lastActivity),
    orders: num(row.orderCount),
    paidOrders: num(row.paidOrders),
    cancelledOrders: num(row.cancelledOrders),
    spent: num(row.spent),
    lastPurchase: toDate(row.lastPurchase),
    cartItems: num(row.cartItems),
    segments: segmentsFor(row),
  }));
  const total = num(countRows[0]?.total);
  return { items, total, page: params.page, pageCount: Math.max(1, Math.ceil(total / params.pageSize)) };
}

export async function getCustomerProfile(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, phone: true, email: true, firstName: true, lastName: true, role: true,
      isActive: true, isVerified: true, createdAt: true, lastLogin: true, lastActivityAt: true,
      adminNote: true, marketingOptIn: true,
      _count: { select: { orders: true } },
      addresses: { orderBy: { createdAt: "desc" } },
      wishlistItems: { orderBy: { createdAt: "desc" }, take: 20, select: { product: { select: { id: true, name: true, slug: true, basePrice: true, salePrice: true } } } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, orderNumber: true, status: true, paymentStatus: true, totalAmount: true, createdAt: true, _count: { select: { items: true } }, returnRequests: { select: { id: true, status: true, createdAt: true } } },
      },
      reviews: { orderBy: { createdAt: "desc" }, take: 10, select: { id: true, rating: true, isApproved: true, createdAt: true, product: { select: { name: true } } } },
      returnRequests: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!user) throw Errors.notFound("مشتری یافت نشد");

  const [paidAggregate, cancelled, cart, viewed] = await Promise.all([
    prisma.order.aggregate({ where: { userId: id, paymentStatus: "PAID" }, _sum: { totalAmount: true }, _count: { _all: true }, _max: { createdAt: true } }),
    prisma.order.count({ where: { userId: id, status: "CANCELLED" } }),
    prisma.cart.findUnique({ where: { userId: id }, include: { items: { include: { product: { select: { id: true, name: true } }, variant: { select: { size: true, color: true } } } } } }),
    prisma.analyticsEvent.findMany({
      where: { customerId: id, name: "product_view", productId: { not: null } },
      orderBy: { createdAt: "desc" },
      distinct: ["productId"],
      take: 12,
      select: { productId: true, createdAt: true },
    }),
  ]);
  const viewedIds = viewed.map((row) => row.productId).filter((value): value is string => Boolean(value));
  const viewedProducts = viewedIds.length
    ? await prisma.product.findMany({ where: { id: { in: viewedIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const viewedNames = new Map(viewedProducts.map((product) => [product.id, product]));

  const paidOrders = paidAggregate._count._all;
  const spent = toToman(paidAggregate._sum.totalAmount ?? 0);
  const rawRow: RawCustomerRow = {
    id: user.id, phone: user.phone, firstName: user.firstName, lastName: user.lastName, email: user.email,
    isActive: user.isActive, role: user.role, createdAt: user.createdAt,
    lastActivity: user.lastActivityAt ?? user.lastLogin ?? user.createdAt,
    orderCount: user.orders.length, paidOrders, cancelledOrders: cancelled, spent,
    lastPurchase: paidAggregate._max.createdAt, cartItems: cart?.items.length ?? 0,
  };

  return {
    ...user,
    roleLabel: roleLabel(user.role),
    totalOrders: user._count.orders,
    spent,
    averageOrderValue: paidOrders ? Math.round(spent / paidOrders) : null,
    paidOrders,
    cancelledOrders: cancelled,
    lastPurchase: paidAggregate._max.createdAt,
    segments: segmentsFor(rawRow),
    cart: cart ? { itemCount: cart.items.length, items: cart.items } : null,
    viewedProducts: viewed.map((row) => ({
      createdAt: row.createdAt,
      product: row.productId ? viewedNames.get(row.productId) ?? null : null,
    })),
    orders: user.orders.map((order) => ({ ...order, total: toToman(order.totalAmount) })),
    wishlistItems: user.wishlistItems.map((item) => ({
      ...item,
      product: { ...item.product, price: toToman(item.product.salePrice ?? item.product.basePrice) },
    })),
  };
}

export async function updateCustomerNotes(id: string, input: { adminNote?: string; marketingOptIn?: boolean }, actorId: string) {
  const before = await prisma.user.findUnique({ where: { id }, select: { adminNote: true, marketingOptIn: true } });
  if (!before) throw Errors.notFound("مشتری یافت نشد");
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.adminNote !== undefined ? { adminNote: input.adminNote.slice(0, 4000) } : {}),
      ...(input.marketingOptIn !== undefined ? { marketingOptIn: input.marketingOptIn } : {}),
    },
    select: { adminNote: true, marketingOptIn: true },
  });
  await audit({ actorId, action: "customer.notes_updated", entity: "User", entityId: id, before, after: user });
  return user;
}

export function customersToCsv(rows: CustomerRow[]): string {
  const escape = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value);
    // Prevent spreadsheet formula injection from user-controlled cells.
    if (/^[=+@]/.test(text) || (/^-/.test(text) && Number.isNaN(Number(text)))) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = ["id", "phone", "first_name", "last_name", "email", "status", "registered_at", "orders", "paid_orders", "cancelled_orders", "spent_toman", "last_purchase", "segments"];
  const lines = rows.map((row) => [
    row.id, row.phone, row.firstName, row.lastName, row.email, row.isActive ? "active" : "inactive",
    row.createdAt.toISOString(), row.orders, row.paidOrders, row.cancelledOrders, row.spent,
    row.lastPurchase?.toISOString() ?? "", row.segments.join("|"),
  ].map(escape).join(","));
  return `\uFEFF${header.join(",")}\n${lines.join("\n")}`;
}
