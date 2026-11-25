import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { AnalyticsEventPayload, AnalyticsEventName } from "@/lib/analytics-types";
import type { DateRange } from "@/lib/date-range";
import { toIsoDay, tehranDayStart } from "@/lib/date-range";
import { toToman } from "@/lib/money";
import { invalidateCache, cached } from "@/lib/cache";

const num = (value: unknown): number => Number(value ?? 0);

export interface AnalyticsSettings {
  enabled: boolean;
  requireConsent: boolean;
  retentionDays: number;
}

export async function getAnalyticsSettings(): Promise<AnalyticsSettings> {
  return cached("settings:analytics", 60_000, async () => {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ["analytics.enabled", "analytics.requireConsent", "analytics.retentionDays"] } },
      select: { key: true, value: true },
    }).catch(() => []);
    const map = new Map(rows.map((row) => [row.key, row.value]));
    const retention = Number(map.get("analytics.retentionDays") ?? 180);
    return {
      enabled: map.get("analytics.enabled") !== "false",
      requireConsent: map.get("analytics.requireConsent") === "true",
      retentionDays: Number.isFinite(retention) ? Math.min(730, Math.max(7, Math.round(retention))) : 180,
    };
  });
}

export function parseUserAgent(userAgent: string | null | undefined): { device: string; browser: string } {
  const ua = (userAgent ?? "").toLowerCase();
  const device = /ipad|tablet/.test(ua) ? "tablet" : /mobile|android|iphone|ipod/.test(ua) ? "mobile" : "desktop";
  const browser = /edg\//.test(ua) ? "Edge" : /firefox/.test(ua) ? "Firefox" : /safari/.test(ua) && !/chrome/.test(ua) ? "Safari" : /chrome/.test(ua) ? "Chrome" : "Other";
  return { device, browser };
}

export function isBot(userAgent: string | null | undefined): boolean {
  const ua = (userAgent ?? "").trim();
  if (!ua) return true;
  return /bot|crawler|spider|crawling|headless|preview|facebookexternalhit|slurp|bingpreview|python-requests|curl|wget/i.test(ua);
}

export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 64);
}

export async function getConsent(sessionId: string, customerId?: string | null) {
  return prisma.analyticsConsent.findFirst({
    where: { OR: [{ sessionId }, ...(customerId ? [{ customerId }] : [])] },
    orderBy: { updatedAt: "desc" },
  });
}

export async function setConsent(input: { sessionId: string; customerId?: string | null; analytics: boolean; marketing: boolean }) {
  const existing = await prisma.analyticsConsent.findUnique({ where: { sessionId: input.sessionId } });
  if (existing) {
    return prisma.analyticsConsent.update({
      where: { id: existing.id },
      data: { analytics: input.analytics, marketing: input.marketing, customerId: input.customerId ?? existing.customerId },
    });
  }
  return prisma.analyticsConsent.create({
    data: {
      sessionId: input.sessionId,
      customerId: input.customerId ?? null,
      analytics: input.analytics,
      marketing: input.marketing,
    },
  });
}

export interface IngestContext {
  sessionId: string;
  customerId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  consentGranted: boolean;
  /** Server-side conversion events bypass the browser bot heuristic. */
  serverEvent?: boolean;
}

/** Server-side validated ingestion. Never throws for analytics failures. */
export async function recordAnalyticsEvent(payload: AnalyticsEventPayload, context: IngestContext) {
  try {
    if (!context.serverEvent && isBot(context.userAgent)) return { recorded: false, reason: "bot" };
    const settings = await getAnalyticsSettings();
    if (!settings.enabled) return { recorded: false, reason: "disabled" };
    if (settings.requireConsent && !context.consentGranted) return { recorded: false, reason: "consent" };

    const { device, browser } = parseUserAgent(context.userAgent);
    const now = new Date();
    const day = tehranDayStart(now);
    const dayOnly = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
    const metadata = payload.metadata as Prisma.InputJsonValue | undefined;
    const isPageView = payload.name === "page_view";

    const recorded = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.analyticsEvent.findUnique({ where: { eventId: payload.eventId }, select: { id: true } });
      if (duplicate) return false;
      const existing = await tx.analyticsSession.findUnique({ where: { id: context.sessionId }, select: { id: true, customerId: true, firstSeenAt: true, pageViews: true } });
      const isNew = !existing;
      if (isNew) {
        await tx.analyticsSession.create({
          data: {
            id: context.sessionId,
            customerId: context.customerId ?? null,
            firstSeenAt: now,
            lastSeenAt: now,
            entryPath: payload.path,
            exitPath: payload.path,
            referrer: payload.referrer?.slice(0, 1024) ?? null,
            utmSource: payload.utmSource?.slice(0, 160) ?? null,
            utmMedium: payload.utmMedium?.slice(0, 160) ?? null,
            utmCampaign: payload.utmCampaign?.slice(0, 160) ?? null,
            device,
            browser,
            pageViews: isPageView ? 1 : 0,
            eventCount: 1,
            isBounced: true,
            consent: true,
            ipHash: context.ip ? hashIp(context.ip, process.env.SESSION_SECRET ?? "ilkaii-analytics") : null,
          },
        });
      } else {
        await tx.analyticsSession.update({
          where: { id: context.sessionId },
          data: {
            lastSeenAt: now,
            exitPath: payload.path,
            ...(isPageView ? { pageViews: { increment: 1 } } : {}),
            eventCount: { increment: 1 },
            ...(payload.name !== "page_view" || (existing?.pageViews ?? 0) >= 1 ? { isBounced: false } : {}),
            ...(context.customerId && !existing.customerId ? { customerId: context.customerId } : {}),
            ...(payload.utmSource && { utmSource: payload.utmSource.slice(0, 160) }),
            ...(payload.utmMedium && { utmMedium: payload.utmMedium.slice(0, 160) }),
            ...(payload.utmCampaign && { utmCampaign: payload.utmCampaign.slice(0, 160) }),
          },
        });
      }

      const inserted = await tx.analyticsEvent.createMany({
        data: [{
          eventId: payload.eventId,
          sessionId: context.sessionId,
          customerId: context.customerId ?? null,
          name: payload.name,
          path: payload.path,
          referrer: payload.referrer?.slice(0, 1024) ?? null,
          device,
          browser,
          utmSource: payload.utmSource?.slice(0, 160) ?? null,
          utmMedium: payload.utmMedium?.slice(0, 160) ?? null,
          utmCampaign: payload.utmCampaign?.slice(0, 160) ?? null,
          productId: payload.productId ?? null,
          categoryId: payload.categoryId ?? null,
          variantId: payload.variantId ?? null,
          metadata,
        }],
        skipDuplicates: true,
      });
      if (!inserted.count) return false;

      const revenue = payload.name === "purchase" ? Math.max(0, Math.round(Number(payload.metadata?.revenue ?? 0))) : 0;
      const increments = {
        visitors: isNew ? 1 : 0,
        sessions: isNew ? 1 : 0,
        pageViews: isPageView ? 1 : 0,
        productViews: payload.name === "product_view" ? 1 : 0,
        addToCarts: payload.name === "add_to_cart" ? 1 : 0,
        checkouts: payload.name === "begin_checkout" ? 1 : 0,
        purchases: payload.name === "purchase" ? 1 : 0,
        revenue,
      };
      await tx.analyticsDailyAggregate.upsert({
        where: { day: dayOnly },
        create: { day: dayOnly, ...increments },
        update: {
          visitors: { increment: increments.visitors },
          sessions: { increment: increments.sessions },
          pageViews: { increment: increments.pageViews },
          productViews: { increment: increments.productViews },
          addToCarts: { increment: increments.addToCarts },
          checkouts: { increment: increments.checkouts },
          purchases: { increment: increments.purchases },
          revenue: { increment: increments.revenue },
        },
      });
      return true;
    });

    if (recorded && context.customerId) {
      await prisma.user.update({ where: { id: context.customerId }, data: { lastActivityAt: now } }).catch(() => undefined);
    }
    if (recorded) {
      invalidateCache("analytics:");
      invalidateCache("dashboard:");
    }
    return { recorded, reason: recorded ? undefined : "duplicate" };
  } catch {
    // Analytics must never break a request path. The caller maps this to 202.
    return { recorded: false, reason: "error" };
  }
}

// ---------------------------------------------------------------------------
// Dashboard aggregations (all values originate from real events/orders)
// ---------------------------------------------------------------------------

export interface FunnelStage {
  key: string;
  label: string;
  sessions: number;
  fromStart: number | null;
  fromPrevious: number | null;
  dropOff: number | null;
  averageSecondsToStage: number | null;
}

export async function getAnalyticsDashboard(range: DateRange) {
  const { from, to } = range;

  const [
    sessionTotals, newReturning, trafficSources, devices, landing, exits,
    productViews, purchasedProducts, sizeDistribution, colorDistribution,
    atcSessions, visitorSessions, funnelCounts, funnelTimes,
    searches, searchSessions, campaigns, orderBehavior, buyerStats, firstPurchase,
  ] = await Promise.all([
    prisma.analyticsSession.aggregate({
      where: { firstSeenAt: { gte: from, lte: to } },
      _count: { _all: true },
      _sum: { pageViews: true, eventCount: true },
    }),
    prisma.$queryRaw<Array<{ newVisitors: unknown; returningVisitors: unknown }>>(Prisma.sql`
      SELECT SUM(CASE WHEN firstSeenAt >= ${from} THEN 1 ELSE 0 END) AS newVisitors,
             SUM(CASE WHEN firstSeenAt < ${from} THEN 1 ELSE 0 END) AS returningVisitors
      FROM AnalyticsSession WHERE lastSeenAt BETWEEN ${from} AND ${to}`),
    prisma.$queryRaw<Array<{ source: string; sessions: unknown; purchases: unknown; revenue: unknown }>>(Prisma.sql`
      SELECT COALESCE(NULLIF(s.utmSource,''),'direct') AS source,
             COUNT(DISTINCT s.id) AS sessions,
             COUNT(DISTINCT CASE WHEN e.name='purchase' THEN e.id END) AS purchases,
             CAST(COALESCE(SUM(CASE WHEN e.name='purchase' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(e.metadata,'$.revenue')) AS DECIMAL(14,2)) WHEN e.name='refund' THEN -CAST(JSON_UNQUOTE(JSON_EXTRACT(e.metadata,'$.revenue')) AS DECIMAL(14,2)) ELSE 0 END),0) AS SIGNED) AS revenue
      FROM AnalyticsSession s
      LEFT JOIN AnalyticsEvent e ON e.sessionId=s.id AND e.createdAt BETWEEN ${from} AND ${to}
      WHERE s.firstSeenAt BETWEEN ${from} AND ${to}
      GROUP BY source ORDER BY sessions DESC LIMIT 12`),
    prisma.$queryRaw<Array<{ label: string; value: unknown }>>(Prisma.sql`
      SELECT COALESCE(device,'unknown') AS label, COUNT(*) AS value FROM AnalyticsSession
      WHERE firstSeenAt BETWEEN ${from} AND ${to} GROUP BY label ORDER BY value DESC`),
    prisma.$queryRaw<Array<{ label: string; value: unknown }>>(Prisma.sql`
      SELECT COALESCE(entryPath,'/') AS label, COUNT(*) AS value FROM AnalyticsSession
      WHERE firstSeenAt BETWEEN ${from} AND ${to} GROUP BY label ORDER BY value DESC LIMIT 10`),
    prisma.$queryRaw<Array<{ label: string; value: unknown }>>(Prisma.sql`
      SELECT COALESCE(exitPath,'/') AS label, COUNT(*) AS value FROM AnalyticsSession
      WHERE lastSeenAt BETWEEN ${from} AND ${to} GROUP BY label ORDER BY value DESC LIMIT 10`),
    prisma.$queryRaw<Array<{ productId: string; views: unknown; sessions: unknown }>>(Prisma.sql`
      SELECT productId, COUNT(*) AS views, COUNT(DISTINCT sessionId) AS sessions
      FROM AnalyticsEvent WHERE name='product_view' AND createdAt BETWEEN ${from} AND ${to} AND productId IS NOT NULL
      GROUP BY productId ORDER BY views DESC LIMIT 15`),
    prisma.$queryRaw<Array<{ productId: string; quantity: unknown; revenue: unknown }>>(Prisma.sql`
      SELECT oi.productId AS productId, CAST(SUM(oi.quantity) AS SIGNED) AS quantity, CAST(SUM(oi.lineTotal) AS SIGNED) AS revenue
      FROM OrderItem oi JOIN \`Order\` o ON o.id=oi.orderId
      WHERE o.paymentStatus='PAID' AND o.createdAt BETWEEN ${from} AND ${to} AND oi.productId IS NOT NULL
      GROUP BY oi.productId ORDER BY quantity DESC LIMIT 15`),
    prisma.$queryRaw<Array<{ label: string; value: unknown }>>(Prisma.sql`
      SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata,'$.size')),'نامشخص') AS label, COUNT(*) AS value
      FROM AnalyticsEvent WHERE name='variant_selected' AND createdAt BETWEEN ${from} AND ${to}
      GROUP BY label ORDER BY value DESC LIMIT 10`),
    prisma.$queryRaw<Array<{ label: string; value: unknown }>>(Prisma.sql`
      SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata,'$.color')),'نامشخص') AS label, COUNT(*) AS value
      FROM AnalyticsEvent WHERE name='variant_selected' AND createdAt BETWEEN ${from} AND ${to}
      GROUP BY label ORDER BY value DESC LIMIT 10`),
    prisma.analyticsEvent.findMany({ where: { name: "add_to_cart", createdAt: { gte: from, lte: to } }, distinct: ["sessionId"], select: { sessionId: true } }),
    prisma.analyticsEvent.findMany({ where: { name: "product_view", createdAt: { gte: from, lte: to } }, distinct: ["sessionId"], select: { sessionId: true } }),
    prisma.$queryRaw<Array<{ visitors: unknown; productView: unknown; addToCart: unknown; checkout: unknown; payment: unknown; purchase: unknown }>>(Prisma.sql`
      SELECT
        (SELECT COUNT(DISTINCT sessionId) FROM AnalyticsEvent WHERE createdAt BETWEEN ${from} AND ${to}) AS visitors,
        (SELECT COUNT(DISTINCT sessionId) FROM AnalyticsEvent WHERE name='product_view' AND createdAt BETWEEN ${from} AND ${to}) AS productView,
        (SELECT COUNT(DISTINCT sessionId) FROM AnalyticsEvent WHERE name='add_to_cart' AND createdAt BETWEEN ${from} AND ${to}) AS addToCart,
        (SELECT COUNT(DISTINCT sessionId) FROM AnalyticsEvent WHERE name='begin_checkout' AND createdAt BETWEEN ${from} AND ${to}) AS checkout,
        (SELECT COUNT(DISTINCT sessionId) FROM AnalyticsEvent WHERE name='payment_initiated' AND createdAt BETWEEN ${from} AND ${to}) AS payment,
        (SELECT COUNT(DISTINCT sessionId) FROM AnalyticsEvent WHERE name='purchase' AND createdAt BETWEEN ${from} AND ${to}) AS purchase`),
    prisma.$queryRaw<Array<{ stage: string; avgSeconds: unknown }>>(Prisma.sql`
      SELECT 'product_view' AS stage, AVG(TIMESTAMPDIFF(SECOND, s.firstSeenAt, f.firstAt)) AS avgSeconds
      FROM (SELECT sessionId, MIN(createdAt) firstAt FROM AnalyticsEvent WHERE name='product_view' AND createdAt BETWEEN ${from} AND ${to} GROUP BY sessionId) f
      JOIN AnalyticsSession s ON s.id=f.sessionId
      UNION ALL
      SELECT 'add_to_cart', AVG(TIMESTAMPDIFF(SECOND, s.firstSeenAt, f.firstAt))
      FROM (SELECT sessionId, MIN(createdAt) firstAt FROM AnalyticsEvent WHERE name='add_to_cart' AND createdAt BETWEEN ${from} AND ${to} GROUP BY sessionId) f
      JOIN AnalyticsSession s ON s.id=f.sessionId
      UNION ALL
      SELECT 'begin_checkout', AVG(TIMESTAMPDIFF(SECOND, s.firstSeenAt, f.firstAt))
      FROM (SELECT sessionId, MIN(createdAt) firstAt FROM AnalyticsEvent WHERE name='begin_checkout' AND createdAt BETWEEN ${from} AND ${to} GROUP BY sessionId) f
      JOIN AnalyticsSession s ON s.id=f.sessionId
      UNION ALL
      SELECT 'payment_initiated', AVG(TIMESTAMPDIFF(SECOND, s.firstSeenAt, f.firstAt))
      FROM (SELECT sessionId, MIN(createdAt) firstAt FROM AnalyticsEvent WHERE name='payment_initiated' AND createdAt BETWEEN ${from} AND ${to} GROUP BY sessionId) f
      JOIN AnalyticsSession s ON s.id=f.sessionId
      UNION ALL
      SELECT 'purchase', AVG(TIMESTAMPDIFF(SECOND, s.firstSeenAt, f.firstAt))
      FROM (SELECT sessionId, MIN(createdAt) firstAt FROM AnalyticsEvent WHERE name='purchase' AND createdAt BETWEEN ${from} AND ${to} GROUP BY sessionId) f
      JOIN AnalyticsSession s ON s.id=f.sessionId`),
    prisma.$queryRaw<Array<{ query: string; searches: unknown; zeroResults: unknown }>>(Prisma.sql`
      SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata,'$.query')),'(بدون عبارت)') AS query,
             COUNT(*) AS searches,
             SUM(CASE WHEN CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata,'$.results')) AS SIGNED)=0 THEN 1 ELSE 0 END) AS zeroResults
      FROM AnalyticsEvent WHERE name='search' AND createdAt BETWEEN ${from} AND ${to}
      GROUP BY query ORDER BY searches DESC LIMIT 15`),
    prisma.$queryRaw<Array<{ searched: unknown; viewed: unknown; purchased: unknown }>>(Prisma.sql`
      SELECT COUNT(*) AS searched,
             SUM(CASE WHEN pv.sessionId IS NOT NULL THEN 1 ELSE 0 END) AS viewed,
             SUM(CASE WHEN pu.sessionId IS NOT NULL THEN 1 ELSE 0 END) AS purchased
      FROM (SELECT DISTINCT sessionId FROM AnalyticsEvent WHERE name='search' AND createdAt BETWEEN ${from} AND ${to}) s
      LEFT JOIN (SELECT DISTINCT sessionId FROM AnalyticsEvent WHERE name='product_view' AND createdAt BETWEEN ${from} AND ${to}) pv ON pv.sessionId=s.sessionId
      LEFT JOIN (SELECT DISTINCT sessionId FROM AnalyticsEvent WHERE name='purchase' AND createdAt BETWEEN ${from} AND ${to}) pu ON pu.sessionId=s.sessionId`),
    prisma.$queryRaw<Array<{ source: string; medium: string; campaign: string; sessions: unknown; purchases: unknown; revenue: unknown }>>(Prisma.sql`
      SELECT COALESCE(NULLIF(s.utmSource,''),'direct') AS source,
             COALESCE(NULLIF(s.utmMedium,''),'—') AS medium,
             COALESCE(NULLIF(s.utmCampaign,''),'—') AS campaign,
             COUNT(DISTINCT s.id) AS sessions,
             COUNT(DISTINCT CASE WHEN e.name='purchase' THEN e.id END) AS purchases,
             CAST(COALESCE(SUM(CASE WHEN e.name='purchase' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(e.metadata,'$.revenue')) AS DECIMAL(14,2)) ELSE 0 END),0) AS SIGNED) AS revenue
      FROM AnalyticsSession s
      LEFT JOIN AnalyticsEvent e ON e.sessionId=s.id AND e.createdAt BETWEEN ${from} AND ${to}
      WHERE s.firstSeenAt BETWEEN ${from} AND ${to}
      GROUP BY source, medium, campaign ORDER BY sessions DESC LIMIT 15`),
    prisma.order.aggregate({ where: { paymentStatus: "PAID", createdAt: { gte: from, lte: to } }, _count: { _all: true }, _sum: { totalAmount: true } }),
    prisma.$queryRaw<Array<{ buyers: unknown; repeatBuyers: unknown; lifetimeOrders: unknown; lifetimeRevenue: unknown }>>(Prisma.sql`
      SELECT COUNT(*) AS buyers,
             SUM(CASE WHEN orders >= 2 THEN 1 ELSE 0 END) AS repeatBuyers,
             SUM(orders) AS lifetimeOrders,
             CAST(SUM(revenue) AS SIGNED) AS lifetimeRevenue
      FROM (SELECT userId, COUNT(*) AS orders, SUM(totalAmount) AS revenue FROM \`Order\`
            WHERE paymentStatus='PAID' GROUP BY userId) t`),
    prisma.$queryRaw<Array<{ avgDays: unknown }>>(Prisma.sql`
      SELECT AVG(TIMESTAMPDIFF(DAY, u.createdAt, f.firstOrder)) AS avgDays
      FROM User u JOIN (
        SELECT userId, MIN(COALESCE(paidAt, createdAt)) AS firstOrder FROM \`Order\`
        WHERE paymentStatus='PAID' GROUP BY userId HAVING firstOrder BETWEEN ${from} AND ${to}
      ) f ON f.userId=u.id`),
  ]);

  const sessions = num(sessionTotals._count._all);
  const pageViews = num(sessionTotals._sum.pageViews);
  const events = num(sessionTotals._sum.eventCount);
  const newVisitors = num(newReturning[0]?.newVisitors);
  const returningVisitors = num(newReturning[0]?.returningVisitors);
  const bounces = await prisma.analyticsSession.count({ where: { firstSeenAt: { gte: from, lte: to }, isBounced: true } });
  const duration = await prisma.$queryRaw<Array<{ avgSeconds: unknown }>>(Prisma.sql`
    SELECT COALESCE(AVG(TIMESTAMPDIFF(SECOND, firstSeenAt, lastSeenAt)),0) AS avgSeconds
    FROM AnalyticsSession WHERE firstSeenAt BETWEEN ${from} AND ${to}`);
  const averageSessionSeconds = num(duration[0]?.avgSeconds);

  const productIds = [...new Set([...productViews.map((row) => row.productId), ...purchasedProducts.map((row) => row.productId)])];
  const productNames = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const nameMap = new Map(productNames.map((product) => [product.id, product]));

  const purchasedMap = new Map(purchasedProducts.map((row) => [row.productId, row]));
  const productRows = productViews.map((row) => {
    const purchase = purchasedMap.get(row.productId);
    const views = num(row.views);
    const quantity = num(purchase?.quantity);
    return {
      id: row.productId,
      name: nameMap.get(row.productId)?.name ?? "محصول حذف‌شده",
      slug: nameMap.get(row.productId)?.slug ?? "",
      views,
      sessions: num(row.sessions),
      purchases: quantity,
      revenue: toToman(num(purchase?.revenue)),
      conversion: views > 0 ? (quantity / views) * 100 : null,
    };
  });
  const highViewsLowPurchase = productRows.filter((row) => row.views >= 10 && row.purchases === 0);

  const funnelNumbers = funnelCounts[0];
  const funnelSessionCounts: Record<string, number> = {
    visitor: num(funnelNumbers?.visitors),
    product_view: num(funnelNumbers?.productView),
    add_to_cart: num(funnelNumbers?.addToCart),
    begin_checkout: num(funnelNumbers?.checkout),
    payment_initiated: num(funnelNumbers?.payment),
    purchase: num(funnelNumbers?.purchase),
  };
  const times = new Map(funnelTimes.map((row) => [row.stage, num(row.avgSeconds)]));
  const stages = [
    { key: "visitor", label: "بازدیدکننده" },
    { key: "product_view", label: "مشاهده محصول" },
    { key: "add_to_cart", label: "افزودن به سبد" },
    { key: "begin_checkout", label: "شروع تسویه" },
    { key: "payment_initiated", label: "شروع پرداخت" },
    { key: "purchase", label: "خرید" },
  ];
  const funnel: FunnelStage[] = stages.map((stage, index) => {
    const count = funnelSessionCounts[stage.key] ?? 0;
    const start = funnelSessionCounts.visitor ?? 0;
    const previous = index === 0 ? null : funnelSessionCounts[stages[index - 1]!.key] ?? 0;
    return {
      ...stage,
      sessions: count,
      fromStart: start > 0 ? (count / start) * 100 : null,
      fromPrevious: previous !== null && previous > 0 ? (count / previous) * 100 : null,
      dropOff: previous !== null && previous > 0 ? ((previous - count) / previous) * 100 : null,
      averageSecondsToStage: times.get(stage.key) ?? null,
    };
  });

  const searchRow = searchSessions[0];
  const searched = num(searchRow?.searched);
  const buyers = num(buyerStats[0]?.buyers);
  const repeatBuyers = num(buyerStats[0]?.repeatBuyers);
  const lifetimeOrders = num(buyerStats[0]?.lifetimeOrders);
  const lifetimeRevenue = num(buyerStats[0]?.lifetimeRevenue);

  return {
    overview: {
      sessions,
      visitors: sessions,
      pageViews,
      events,
      pageViewsPerSession: sessions ? pageViews / sessions : 0,
      averageSessionSeconds,
      bounceRate: sessions ? (bounces / sessions) * 100 : 0,
      newVisitors,
      returningVisitors,
      newVisitorRate: newVisitors + returningVisitors > 0 ? (newVisitors / (newVisitors + returningVisitors)) * 100 : 0,
    },
    traffic: {
      sources: trafficSources.map((row) => ({ label: row.source, value: num(row.sessions), purchases: num(row.purchases), revenue: toToman(num(row.revenue)) })),
      devices: devices.map((row) => ({ label: row.label, value: num(row.value) })),
      landingPages: landing.map((row) => ({ label: row.label, value: num(row.value) })),
      exitPages: exits.map((row) => ({ label: row.label, value: num(row.value) })),
    },
    products: {
      rows: productRows,
      highViewsLowPurchase,
      sizeDistribution: sizeDistribution.map((row) => ({ label: row.label, value: num(row.value) })),
      colorDistribution: colorDistribution.map((row) => ({ label: row.label, value: num(row.value) })),
      addToCartRate: visitorSessions.length ? (atcSessions.length / visitorSessions.length) * 100 : null,
      abandonmentRate: visitorSessions.length ? ((visitorSessions.length - atcSessions.length) / visitorSessions.length) * 100 : null,
    },
    funnel,
    search: {
      keywords: searches.map((row) => ({ label: row.query, searches: num(row.searches), zeroResults: num(row.zeroResults) })),
      searchedSessions: searched,
      toProductViewRate: searched ? (num(searchRow?.viewed) / searched) * 100 : null,
      toPurchaseRate: searched ? (num(searchRow?.purchased) / searched) * 100 : null,
    },
    campaigns: campaigns.map((row) => ({
      source: row.source, medium: row.medium, campaign: row.campaign,
      sessions: num(row.sessions), purchases: num(row.purchases), revenue: toToman(num(row.revenue)),
      conversion: num(row.sessions) ? (num(row.purchases) / num(row.sessions)) * 100 : null,
    })),
    behavior: {
      orders: num(orderBehavior._count._all),
      revenue: toToman(orderBehavior._sum.totalAmount ?? 0),
      buyers,
      repeatBuyers,
      repeatRate: buyers ? (repeatBuyers / buyers) * 100 : null,
      purchaseFrequency: buyers ? lifetimeOrders / buyers : null,
      averageLifetimeValue: buyers ? Math.round(lifetimeRevenue / buyers) : null,
      lifetimeValueConfidence: buyers >= 20 ? "observed" : "insufficient",
      averageDaysToFirstPurchase: firstPurchase[0]?.avgDays === null || firstPurchase[0]?.avgDays === undefined ? null : Math.round(num(firstPurchase[0].avgDays) * 10) / 10,
    },
    range: { from: toIsoDay(from), to: toIsoDay(to), days: range.days },
  };
}

export type AnalyticsDashboard = Awaited<ReturnType<typeof getAnalyticsDashboard>>;

// ---------------------------------------------------------------------------
// Session explorer
// ---------------------------------------------------------------------------

export async function listAnalyticsSessions(params: {
  range: DateRange;
  page: number;
  pageSize: number;
  device?: string;
  source?: string;
  customerId?: string;
}) {
  const where: Prisma.AnalyticsSessionWhereInput = {
    firstSeenAt: { gte: params.range.from, lte: params.range.to },
    ...(params.device ? { device: params.device } : {}),
    ...(params.source ? { utmSource: params.source } : {}),
    ...(params.customerId ? { customerId: params.customerId } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.analyticsSession.count({ where }),
    prisma.analyticsSession.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: { customer: { select: { id: true, phone: true, firstName: true, lastName: true } } },
    }),
  ]);
  return { items, total, page: params.page, pageCount: Math.max(1, Math.ceil(total / params.pageSize)) };
}

export async function getAnalyticsSession(id: string) {
  const session = await prisma.analyticsSession.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, phone: true, firstName: true, lastName: true } },
      events: { orderBy: { createdAt: "asc" }, take: 500 },
    },
  });
  return session;
}

/** Delete raw events beyond the configured retention window (cron). */
export async function applyRetentionPolicy() {
  const settings = await getAnalyticsSettings();
  const cutoff = new Date(Date.now() - settings.retentionDays * 24 * 60 * 60 * 1000);
  const deleted = await prisma.analyticsEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  const sessions = await prisma.analyticsSession.deleteMany({ where: { lastSeenAt: { lt: cutoff }, events: { none: {} } } });
  return { deletedEvents: deleted.count, deletedSessions: sessions.count, retentionDays: settings.retentionDays };
}

export type AnalyticsEventNameType = AnalyticsEventName;
