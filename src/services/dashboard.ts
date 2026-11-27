import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toToman } from "@/lib/money";
import { countLowStockVariants } from "@/services/catalog";
import type { DateRange } from "@/lib/date-range";
import { toIsoDay } from "@/lib/date-range";

const num = (value: unknown): number => Number(value ?? 0);

export interface DashboardData {
  range: { from: Date; to: Date; key: string; days: number };
  revenue: {
    gross: number;
    refunds: number;
    net: number;
    discounts: number;
    shipping: number;
    paidOrders: number;
    averageOrderValue: number | null;
    conversionRate: number | null;
    sessionCount: number;
    activeSessions: number;
  };
  orders: { total: number; pending: number; completed: number; cancelled: number; refunded: number };
  customers: { total: number; newCustomers: number; returningBuyers: number; buyers: number };
  currentCustomers: { total: number; newInRange: number };
  lowStockCount: number;
  charts: {
    salesDaily: Array<{ label: string; value: number; secondary?: number }>;
    ordersDaily: Array<{ label: string; value: number }>;
    visitorsDaily: Array<{ label: string; value: number }>;
    previousRevenue: number;
    salesByCategory: Array<{ label: string; value: number }>;
    salesByProduct: Array<{ label: string; value: number }>;
    trafficSources: Array<{ label: string; value: number; purchases: number; revenue: number }>;
  };
  recentOrders: Array<{ id: string; orderNumber: string; total: number; status: string; createdAt: Date }>;
  bestSellers: Array<{ id: string; name: string; quantity: number; revenue: number }>;
}

export async function getDashboardData(range: DateRange): Promise<DashboardData> {
  const { from, to, previousFrom, previousTo } = range;

  // Gross revenue includes orders that were later refunded; refunds are
  // subtracted separately from the refund ledger (including partial refunds).
  const paidWhere: Prisma.OrderWhereInput = {
    paymentStatus: { in: ["PAID", "REFUNDED"] },
    OR: [
      { paidAt: { gte: from, lte: to } },
      { paidAt: null, createdAt: { gte: from, lte: to } },
    ],
  };

  const [
    orderCounts,
    paidAggregate,
    refundAggregate,
    customersTotal,
    newCustomers,
    lowStockCount,
    recentOrders,
    sessionsCount,
    activeSessions,
    previousPaid,
    salesDaily,
    ordersDaily,
    visitorsDaily,
    salesByCategory,
    salesByProduct,
    trafficSources,
    bestSellerRows,
    buyerIds,
  ] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], where: { createdAt: { gte: from, lte: to } }, _count: { _all: true } }),
    prisma.order.aggregate({ where: paidWhere, _sum: { totalAmount: true, discountAmount: true, shippingCost: true }, _count: { _all: true } }),
    prisma.refund.aggregate({ where: { status: "COMPLETED", createdAt: { gte: from, lte: to } }, _sum: { amount: true }, _count: { _all: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "CUSTOMER", createdAt: { gte: from, lte: to } } }),
    countLowStockVariants(),
    prisma.order.findMany({ where: { createdAt: { gte: from, lte: to } }, orderBy: { createdAt: "desc" }, take: 8, select: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true } }),
    prisma.analyticsSession.count({ where: { firstSeenAt: { gte: from, lte: to } } }),
    prisma.analyticsSession.count({ where: { lastSeenAt: { gte: new Date(Date.now() - 30 * 60 * 1000) } } }),
    prisma.order.aggregate({ where: { paymentStatus: { in: ["PAID", "REFUNDED"] }, createdAt: { gte: previousFrom, lte: previousTo } }, _sum: { totalAmount: true } }),
    prisma.$queryRaw<Array<{ day: string; total: unknown; count: unknown }>>(Prisma.sql`
      SELECT DATE_FORMAT(DATE_ADD(COALESCE(paidAt, createdAt), INTERVAL 210 MINUTE), '%Y-%m-%d') AS day,
             CAST(SUM(totalAmount) AS SIGNED) AS total,
             COUNT(*) AS count
      FROM \`Order\`
      WHERE paymentStatus IN ('PAID', 'REFUNDED') AND COALESCE(paidAt, createdAt) BETWEEN ${from} AND ${to}
      GROUP BY day ORDER BY day ASC`),
    prisma.$queryRaw<Array<{ day: string; count: unknown; total: unknown }>>(Prisma.sql`
      SELECT DATE_FORMAT(DATE_ADD(createdAt, INTERVAL 210 MINUTE), '%Y-%m-%d') AS day,
             COUNT(*) AS count, CAST(SUM(totalAmount) AS SIGNED) AS total
      FROM \`Order\`
      WHERE createdAt BETWEEN ${from} AND ${to}
      GROUP BY day ORDER BY day ASC`),
    prisma.$queryRaw<Array<{ day: string; sessions: unknown; pageViews: unknown }>>(Prisma.sql`
      SELECT DATE_FORMAT(day, '%Y-%m-%d') AS day, sessions, pageViews
      FROM AnalyticsDailyAggregate
      WHERE day BETWEEN ${toIsoDay(from)} AND ${toIsoDay(to)}
      ORDER BY day ASC`),
    prisma.$queryRaw<Array<{ name: string; total: unknown; quantity: unknown }>>(Prisma.sql`
      SELECT c.name AS name, CAST(SUM(oi.lineTotal) AS SIGNED) AS total, CAST(SUM(oi.quantity) AS SIGNED) AS quantity
      FROM OrderItem oi
      JOIN \`Order\` o ON o.id = oi.orderId
      JOIN Product p ON p.id = oi.productId
      JOIN Category c ON c.id = p.categoryId
      WHERE o.paymentStatus = 'PAID' AND o.createdAt BETWEEN ${from} AND ${to}
      GROUP BY c.id, c.name ORDER BY total DESC LIMIT 8`),
    prisma.$queryRaw<Array<{ id: string; name: string; total: unknown; quantity: unknown }>>(Prisma.sql`
      SELECT p.id AS id, p.name AS name, CAST(SUM(oi.lineTotal) AS SIGNED) AS total, CAST(SUM(oi.quantity) AS SIGNED) AS quantity
      FROM OrderItem oi
      JOIN \`Order\` o ON o.id = oi.orderId
      JOIN Product p ON p.id = oi.productId
      WHERE o.paymentStatus = 'PAID' AND o.createdAt BETWEEN ${from} AND ${to}
      GROUP BY p.id, p.name ORDER BY total DESC LIMIT 8`),
    prisma.$queryRaw<Array<{ label: string; sessions: unknown; purchases: unknown; revenue: unknown }>>(Prisma.sql`
      SELECT COALESCE(s.utmSource, 'direct') AS label,
             COUNT(DISTINCT s.id) AS sessions,
             COUNT(DISTINCT CASE WHEN e.name = 'purchase' THEN e.id END) AS purchases,
             CAST(COALESCE(SUM(CASE WHEN e.name='purchase'
               THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(e.metadata, '$.revenue')) AS DECIMAL(14,2))
               WHEN e.name='refund' THEN -CAST(JSON_UNQUOTE(JSON_EXTRACT(e.metadata, '$.revenue')) AS DECIMAL(14,2))
               ELSE 0 END), 0) AS SIGNED) AS revenue
      FROM AnalyticsSession s
      LEFT JOIN AnalyticsEvent e ON e.sessionId = s.id
      WHERE s.firstSeenAt BETWEEN ${from} AND ${to}
      GROUP BY label ORDER BY sessions DESC LIMIT 8`),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { paymentStatus: "PAID", createdAt: { gte: from, lte: to } }, productId: { not: null } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 8,
    }),
    prisma.order.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: from, lte: to } },
      distinct: ["userId"],
      select: { userId: true },
    }),
  ]);

  const statusCount = (status: string) => num(orderCounts.find((row) => row.status === status)?._count._all);
  const completed = ["PAID", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED"].reduce((sum, status) => sum + statusCount(status), 0);
  // Orders refunded before the refund ledger existed have no Refund rows.
  const legacyRefunds = await prisma.order.aggregate({
    where: {
      paymentStatus: "REFUNDED",
      updatedAt: { gte: from, lte: to },
      refunds: { none: { status: "COMPLETED" } },
    },
    _sum: { totalAmount: true },
  });
  const gross = toToman(paidAggregate._sum.totalAmount ?? 0);
  const refunds = toToman(refundAggregate._sum.amount ?? 0) + toToman(legacyRefunds._sum.totalAmount ?? 0);
  const paidOrders = num(paidAggregate._count._all);
  const buyerIdList = buyerIds.map((row) => row.userId);
  const returningRows = buyerIdList.length
    ? await prisma.order.findMany({
        where: { paymentStatus: "PAID", createdAt: { lt: from }, userId: { in: buyerIdList } },
        distinct: ["userId"],
        select: { userId: true },
      })
    : [];

  const bestSellerIds = bestSellerRows.map((row) => row.productId).filter((id): id is string => Boolean(id));
  const bestSellerProducts = bestSellerIds.length
    ? await prisma.product.findMany({ where: { id: { in: bestSellerIds } }, select: { id: true, name: true } })
    : [];
  const productNames = new Map(bestSellerProducts.map((product) => [product.id, product.name]));

  const salesMap = new Map(salesDaily.map((row) => [row.day, num(row.total)]));
  const ordersMap = new Map(ordersDaily.map((row) => [row.day, num(row.count)]));
  const visitorsMap = new Map(visitorsDaily.map((row) => [row.day, num(row.sessions)]));

  // Fill every day so charts show real zero days instead of hiding gaps.
  const days: string[] = [];
  for (let cursor = new Date(from); cursor <= to; cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)) {
    days.push(toIsoDay(cursor));
    if (days.length > 370) break;
  }
  const uniqueDays = [...new Set(days)];
  const previousRevenue = toToman(previousPaid._sum.totalAmount ?? 0);
  const conversionRate = sessionsCount > 0 ? (paidOrders / sessionsCount) * 100 : null;

  return {
    range: { from, to, key: range.key, days: range.days },
    revenue: {
      gross,
      refunds,
      net: Math.max(0, gross - refunds),
      discounts: toToman(paidAggregate._sum.discountAmount ?? 0),
      shipping: toToman(paidAggregate._sum.shippingCost ?? 0),
      paidOrders,
      averageOrderValue: paidOrders ? Math.round(gross / paidOrders) : null,
      conversionRate,
      sessionCount: sessionsCount,
      activeSessions,
    },
    orders: {
      total: orderCounts.reduce((sum, row) => sum + num(row._count._all), 0),
      pending: statusCount("PENDING_PAYMENT"),
      completed,
      cancelled: statusCount("CANCELLED"),
      refunded: statusCount("REFUNDED"),
    },
    customers: {
      total: customersTotal,
      newCustomers,
      returningBuyers: returningRows.length,
      buyers: buyerIdList.length,
    },
    currentCustomers: { total: customersTotal, newInRange: newCustomers },
    lowStockCount,
    charts: {
      salesDaily: uniqueDays.map((day) => ({ label: day.slice(5), value: salesMap.get(day) ?? 0 })),
      ordersDaily: uniqueDays.map((day) => ({ label: day.slice(5), value: ordersMap.get(day) ?? 0 })),
      visitorsDaily: uniqueDays.map((day) => ({ label: day.slice(5), value: visitorsMap.get(day) ?? 0 })),
      previousRevenue,
      salesByCategory: salesByCategory.map((row) => ({ label: row.name, value: num(row.total) })),
      salesByProduct: salesByProduct.map((row) => ({ label: row.name, value: num(row.total) })),
      trafficSources: trafficSources.map((row) => ({ label: row.label, value: num(row.sessions), purchases: num(row.purchases), revenue: num(row.revenue) })),
    },
    recentOrders: recentOrders.map((order) => ({ ...order, total: toToman(order.totalAmount), status: order.status })),
    bestSellers: bestSellerRows.map((row) => ({
      id: row.productId ?? "",
      name: productNames.get(row.productId ?? "") ?? "—",
      quantity: num(row._sum.quantity),
      revenue: toToman(row._sum.lineTotal ?? 0),
    })),
  };
}
