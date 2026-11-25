import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { toToman } from "@/lib/money";
import type { DateRange } from "@/lib/date-range";
import { toIsoDay } from "@/lib/date-range";

const num = (value: unknown): number => Number(value ?? 0);

export const REPORT_TYPES = [
  { key: "sales", label: "فروش" },
  { key: "revenue", label: "درآمد" },
  { key: "products", label: "عملکرد محصول" },
  { key: "categories", label: "عملکرد دسته‌بندی" },
  { key: "inventory", label: "موجودی" },
  { key: "customers", label: "مشتریان" },
  { key: "campaigns", label: "کمپین‌ها" },
  { key: "refunds", label: "بازپرداخت‌ها" },
  { key: "shipping", label: "ارسال" },
  { key: "retention", label: "ماندگاری مشتری" },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]["key"];
export type ReportGroup = "day" | "week" | "month";
export type ReportCellType = "text" | "number" | "toman" | "date";

export interface ReportColumn {
  key: string;
  label: string;
  type?: ReportCellType;
}

export interface ReportSummary {
  label: string;
  value: number | string;
  type?: "number" | "toman" | "text";
}

export interface ReportResult {
  title: string;
  description: string;
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
  summary: ReportSummary[];
}

const GROUP_EXPR: Record<ReportGroup, Prisma.Sql> = {
  day: Prisma.sql`DATE_FORMAT(DATE_ADD(COALESCE(o.paidAt, o.createdAt), INTERVAL 210 MINUTE), '%Y-%m-%d')`,
  week: Prisma.sql`DATE_FORMAT(DATE_ADD(COALESCE(o.paidAt, o.createdAt), INTERVAL 210 MINUTE), '%x-W%v')`,
  month: Prisma.sql`DATE_FORMAT(DATE_ADD(COALESCE(o.paidAt, o.createdAt), INTERVAL 210 MINUTE), '%Y-%m')`,
};

export async function buildReport(type: ReportType, range: DateRange, group: ReportGroup = "day"): Promise<ReportResult> {
  const { from, to, previousFrom, previousTo } = range;
  switch (type) {
    case "sales":
    case "revenue": {
      const rows = await prisma.$queryRaw<Array<{ period: string; orders: unknown; paidOrders: unknown; revenue: unknown; discounts: unknown; shipping: unknown }>>(Prisma.sql`
        SELECT ${GROUP_EXPR[group]} AS period,
               COUNT(*) AS orders,
               SUM(CASE WHEN o.paymentStatus='PAID' THEN 1 ELSE 0 END) AS paidOrders,
               CAST(COALESCE(SUM(CASE WHEN o.paymentStatus='PAID' THEN o.totalAmount ELSE 0 END),0) AS SIGNED) AS revenue,
               CAST(COALESCE(SUM(CASE WHEN o.paymentStatus='PAID' THEN o.discountAmount ELSE 0 END),0) AS SIGNED) AS discounts,
               CAST(COALESCE(SUM(CASE WHEN o.paymentStatus='PAID' THEN o.shippingCost ELSE 0 END),0) AS SIGNED) AS shipping
        FROM \`Order\` o WHERE o.createdAt BETWEEN ${from} AND ${to}
        GROUP BY period ORDER BY period ASC`);
      const previous = await prisma.order.aggregate({ where: { paymentStatus: "PAID", createdAt: { gte: previousFrom, lte: previousTo } }, _sum: { totalAmount: true }, _count: { _all: true } });
      const paid = await prisma.order.aggregate({ where: { paymentStatus: "PAID", createdAt: { gte: from, lte: to } }, _sum: { totalAmount: true, discountAmount: true, shippingCost: true }, _count: { _all: true } });
      const refunds = await prisma.order.aggregate({ where: { paymentStatus: "REFUNDED", updatedAt: { gte: from, lte: to } }, _sum: { totalAmount: true }, _count: { _all: true } });
      const revenue = toToman(paid._sum.totalAmount ?? 0);
      const resultRows = rows.map((row) => ({
        period: row.period,
        orders: num(row.orders),
        paidOrders: num(row.paidOrders),
        revenue: num(row.revenue),
        discounts: num(row.discounts),
        shipping: num(row.shipping),
      }));
      return {
        title: type === "sales" ? "گزارش فروش" : "گزارش درآمد",
        description: "فروش ناخالص = مجموع مبلغ سفارش‌های پرداخت‌شده. فروش خالص = فروش ناخالص منهای بازپرداخت‌های ثبت‌شده در بازه. تاریخ‌ها بر اساس منطقه زمانی تهران هستند.",
        columns: [
          { key: "period", label: group === "day" ? "روز" : group === "week" ? "هفته" : "ماه" },
          { key: "orders", label: "سفارش", type: "number" },
          { key: "paidOrders", label: "پرداخت‌شده", type: "number" },
          { key: "revenue", label: "فروش ناخالص (تومان)", type: "toman" },
          { key: "discounts", label: "تخفیف (تومان)", type: "toman" },
          { key: "shipping", label: "هزینه ارسال (تومان)", type: "toman" },
        ],
        rows: resultRows,
        summary: [
          { label: "فروش ناخالص", value: revenue, type: "toman" },
          { label: "بازپرداخت", value: toToman(refunds._sum.totalAmount ?? 0), type: "toman" },
          { label: "فروش خالص", value: Math.max(0, revenue - toToman(refunds._sum.totalAmount ?? 0)), type: "toman" },
          { label: "سفارش پرداخت‌شده", value: num(paid._count._all), type: "number" },
          { label: "میانگین سفارش", value: num(paid._count._all) ? Math.round(revenue / num(paid._count._all)) : 0, type: "toman" },
          { label: "فروش دوره قبل", value: toToman(previous._sum.totalAmount ?? 0), type: "toman" },
        ],
      };
    }
    case "products": {
      const rows = await prisma.$queryRaw<Array<{ name: string; sku: string; quantity: unknown; revenue: unknown; orders: unknown }>>(Prisma.sql`
        SELECT p.name, p.sku,
               CAST(SUM(oi.quantity) AS SIGNED) AS quantity,
               CAST(SUM(oi.lineTotal) AS SIGNED) AS revenue,
               COUNT(DISTINCT o.id) AS orders
        FROM OrderItem oi
        JOIN \`Order\` o ON o.id=oi.orderId
        JOIN Product p ON p.id=oi.productId
        WHERE o.paymentStatus='PAID' AND o.createdAt BETWEEN ${from} AND ${to}
        GROUP BY p.id, p.name, p.sku ORDER BY revenue DESC LIMIT 500`);
      const resultRows = rows.map((row) => ({ name: row.name, sku: row.sku, quantity: num(row.quantity), revenue: num(row.revenue), orders: num(row.orders) }));
      return {
        title: "عملکرد محصول",
        description: "مبلغ و تعداد اقلام فروخته‌شده در سفارش‌های پرداخت‌شده؛ بدون کسر بازپرداخت.",
        columns: [
          { key: "name", label: "محصول" }, { key: "sku", label: "SKU" },
          { key: "quantity", label: "تعداد", type: "number" },
          { key: "orders", label: "سفارش", type: "number" },
          { key: "revenue", label: "درآمد (تومان)", type: "toman" },
        ],
        rows: resultRows,
        summary: [
          { label: "اقلام فروخته‌شده", value: resultRows.reduce((sum, row) => sum + row.quantity, 0), type: "number" },
          { label: "درآمد اقلام", value: resultRows.reduce((sum, row) => sum + row.revenue, 0), type: "toman" },
        ],
      };
    }
    case "categories": {
      const rows = await prisma.$queryRaw<Array<{ name: string; quantity: unknown; revenue: unknown; products: unknown }>>(Prisma.sql`
        SELECT c.name, CAST(SUM(oi.quantity) AS SIGNED) AS quantity, CAST(SUM(oi.lineTotal) AS SIGNED) AS revenue,
               COUNT(DISTINCT p.id) AS products
        FROM OrderItem oi JOIN \`Order\` o ON o.id=oi.orderId
        JOIN Product p ON p.id=oi.productId JOIN Category c ON c.id=p.categoryId
        WHERE o.paymentStatus='PAID' AND o.createdAt BETWEEN ${from} AND ${to}
        GROUP BY c.id, c.name ORDER BY revenue DESC`);
      const resultRows = rows.map((row) => ({ name: row.name, quantity: num(row.quantity), revenue: num(row.revenue), products: num(row.products) }));
      return {
        title: "عملکرد دسته‌بندی",
        description: "فروش اقلام گروه‌بندی‌شده بر اساس دسته‌بندی محصول.",
        columns: [
          { key: "name", label: "دسته‌بندی" }, { key: "products", label: "محصولات", type: "number" },
          { key: "quantity", label: "تعداد فروش", type: "number" }, { key: "revenue", label: "درآمد", type: "toman" },
        ],
        rows: resultRows,
        summary: [{ label: "درآمد دسته‌ها", value: resultRows.reduce((sum, row) => sum + row.revenue, 0), type: "toman" }],
      };
    }
    case "inventory": {
      const rows = await prisma.$queryRaw<Array<{ product: string; sku: string; variant: string; stock: unknown; threshold: unknown; price: unknown; active: unknown }>>(Prisma.sql`
        SELECT p.name AS product, v.sku, CONCAT(v.size, COALESCE(CONCAT(' / ', v.color), '')) AS variant,
               v.stock, v.lowStockThreshold AS threshold, CAST(COALESCE(v.price, p.basePrice) AS SIGNED) AS price, v.isAvailable AS active
        FROM ProductVariant v JOIN Product p ON p.id=v.productId
        WHERE p.isDeleted=0 ORDER BY v.stock ASC LIMIT 1000`);
      const resultRows = rows.map((row) => ({
        product: row.product, sku: row.sku, variant: row.variant, stock: num(row.stock),
        threshold: num(row.threshold), price: num(row.price), active: Boolean(row.active),
        value: num(row.stock) * num(row.price),
      }));
      return {
        title: "گزارش موجودی",
        description: "موجودی فعلی همه تنوع‌ها؛ ارزش موجودی با قیمت تنوع یا قیمت پایه محصول محاسبه می‌شود.",
        columns: [
          { key: "product", label: "محصول" }, { key: "sku", label: "SKU" }, { key: "variant", label: "تنوع" },
          { key: "stock", label: "موجودی", type: "number" }, { key: "threshold", label: "آستانه", type: "number" },
          { key: "price", label: "قیمت", type: "toman" }, { key: "value", label: "ارزش", type: "toman" },
        ],
        rows: resultRows,
        summary: [
          { label: "تنوع‌ها", value: resultRows.length, type: "number" },
          { label: "ارزش موجودی", value: resultRows.reduce((sum, row) => sum + row.value, 0), type: "toman" },
          { label: "زیر آستانه", value: resultRows.filter((row) => row.stock <= row.threshold).length, type: "number" },
        ],
      };
    }
    case "customers": {
      const rows = await prisma.$queryRaw<Array<{ phone: string; name: string; orders: unknown; spent: unknown; lastPurchase: Date | null }>>(Prisma.sql`
        SELECT u.phone, CONCAT(COALESCE(u.firstName,''),' ',COALESCE(u.lastName,'')) AS name,
               COUNT(DISTINCT o.id) AS orders, CAST(COALESCE(SUM(o.totalAmount),0) AS SIGNED) AS spent,
               MAX(o.createdAt) AS lastPurchase
        FROM \`User\` u JOIN \`Order\` o ON o.userId=u.id AND o.paymentStatus='PAID'
        WHERE o.createdAt BETWEEN ${from} AND ${to}
        GROUP BY u.id, u.phone, u.firstName, u.lastName ORDER BY spent DESC LIMIT 1000`);
      const resultRows = rows.map((row) => ({ phone: row.phone, name: row.name.trim() || "بدون نام", orders: num(row.orders), spent: num(row.spent), lastPurchase: row.lastPurchase ? row.lastPurchase.toISOString() : null }));
      return {
        title: "گزارش مشتریان",
        description: "خریداران دارای سفارش پرداخت‌شده در بازه؛ مبالغ فقط خریدهای همان بازه هستند.",
        columns: [
          { key: "name", label: "مشتری" }, { key: "phone", label: "موبایل" },
          { key: "orders", label: "سفارش", type: "number" }, { key: "spent", label: "خرید", type: "toman" },
          { key: "lastPurchase", label: "آخرین خرید", type: "date" },
        ],
        rows: resultRows,
        summary: [
          { label: "خریداران", value: resultRows.length, type: "number" },
          { label: "درآمد", value: resultRows.reduce((sum, row) => sum + row.spent, 0), type: "toman" },
        ],
      };
    }
    case "campaigns": {
      const rows = await prisma.$queryRaw<Array<{ campaign: string; source: string; sessions: unknown; purchases: unknown; revenue: unknown }>>(Prisma.sql`
        SELECT COALESCE(NULLIF(s.utmCampaign,''),'—') AS campaign, COALESCE(NULLIF(s.utmSource,''),'direct') AS source,
               COUNT(DISTINCT s.id) AS sessions,
               COUNT(DISTINCT CASE WHEN e.name='purchase' THEN e.id END) AS purchases,
               CAST(COALESCE(SUM(CASE WHEN e.name='purchase' THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(e.metadata,'$.revenue')) AS DECIMAL(14,2)) WHEN e.name='refund' THEN -CAST(JSON_UNQUOTE(JSON_EXTRACT(e.metadata,'$.revenue')) AS DECIMAL(14,2)) ELSE 0 END),0) AS SIGNED) AS revenue
        FROM AnalyticsSession s LEFT JOIN AnalyticsEvent e ON e.sessionId=s.id AND e.createdAt BETWEEN ${from} AND ${to}
        WHERE s.firstSeenAt BETWEEN ${from} AND ${to}
        GROUP BY campaign, source ORDER BY revenue DESC`);
      const resultRows = rows.map((row) => ({ campaign: row.campaign, source: row.source, sessions: num(row.sessions), purchases: num(row.purchases), revenue: num(row.revenue), conversion: num(row.sessions) ? `${Math.round((num(row.purchases) / num(row.sessions)) * 1000) / 10}٪` : "—" }));
      return {
        title: "گزارش کمپین",
        description: "نشست‌های UTM و خریدهای همان نشست. درآمد شامل کسر رویدادهای بازپرداخت است.",
        columns: [
          { key: "campaign", label: "کمپین" }, { key: "source", label: "منبع" },
          { key: "sessions", label: "نشست", type: "number" }, { key: "purchases", label: "خرید", type: "number" },
          { key: "revenue", label: "درآمد", type: "toman" },
        ],
        rows: resultRows,
        summary: [
          { label: "نشست‌ها", value: resultRows.reduce((sum, row) => sum + row.sessions, 0), type: "number" },
          { label: "درآمد", value: resultRows.reduce((sum, row) => sum + row.revenue, 0), type: "toman" },
        ],
      };
    }
    case "refunds": {
      const rows = await prisma.$queryRaw<Array<{ orderNumber: string; createdAt: Date; amount: unknown; status: string }>>(Prisma.sql`
        SELECT orderNumber, updatedAt AS createdAt, CAST(totalAmount AS SIGNED) AS amount, status
        FROM \`Order\` WHERE paymentStatus='REFUNDED' AND updatedAt BETWEEN ${from} AND ${to}
        ORDER BY updatedAt DESC`);
      const resultRows = rows.map((row) => ({ orderNumber: row.orderNumber, createdAt: row.createdAt.toISOString(), amount: num(row.amount), status: row.status }));
      return {
        title: "گزارش بازپرداخت",
        description: "سفارش‌هایی که در بازه به وضعیت بازپرداخت‌شده تغییر کرده‌اند.",
        columns: [
          { key: "orderNumber", label: "سفارش" }, { key: "createdAt", label: "تاریخ", type: "date" },
          { key: "amount", label: "مبلغ", type: "toman" }, { key: "status", label: "وضعیت" },
        ],
        rows: resultRows,
        summary: [{ label: "بازپرداخت‌ها", value: resultRows.reduce((sum, row) => sum + row.amount, 0), type: "toman" }],
      };
    }
    case "shipping": {
      const rows = await prisma.$queryRaw<Array<{ method: string; orders: unknown; revenue: unknown; shipping: unknown }>>(Prisma.sql`
        SELECT shippingMethod AS method, COUNT(*) AS orders,
               CAST(COALESCE(SUM(totalAmount),0) AS SIGNED) AS revenue,
               CAST(COALESCE(SUM(shippingCost),0) AS SIGNED) AS shipping
        FROM \`Order\` WHERE paymentStatus='PAID' AND createdAt BETWEEN ${from} AND ${to}
        GROUP BY shippingMethod`);
      const resultRows = rows.map((row) => ({ method: row.method, orders: num(row.orders), revenue: num(row.revenue), shipping: num(row.shipping) }));
      return {
        title: "گزارش ارسال",
        description: "توزیع روش‌های ارسال و هزینه دریافتی ارسال در سفارش‌های پرداخت‌شده.",
        columns: [
          { key: "method", label: "روش" }, { key: "orders", label: "سفارش", type: "number" },
          { key: "revenue", label: "مبلغ سفارش", type: "toman" }, { key: "shipping", label: "هزینه ارسال", type: "toman" },
        ],
        rows: resultRows,
        summary: [{ label: "درآمد ارسال", value: resultRows.reduce((sum, row) => sum + row.shipping, 0), type: "toman" }],
      };
    }
    case "retention": {
      const rows = await prisma.$queryRaw<Array<{ cohort: string; customers: unknown; repeatCustomers: unknown; revenue: unknown }>>(Prisma.sql`
        SELECT DATE_FORMAT(DATE_ADD(firstOrder, INTERVAL 210 MINUTE), '%Y-%m') AS cohort,
               COUNT(*) AS customers,
               SUM(CASE WHEN orders >= 2 THEN 1 ELSE 0 END) AS repeatCustomers,
               CAST(SUM(revenue) AS SIGNED) AS revenue
        FROM (
          SELECT userId, MIN(createdAt) AS firstOrder, COUNT(*) AS orders, SUM(totalAmount) AS revenue
          FROM \`Order\` WHERE paymentStatus='PAID' GROUP BY userId
        ) t GROUP BY cohort ORDER BY cohort DESC LIMIT 24`);
      const resultRows = rows.map((row) => ({
        cohort: row.cohort, customers: num(row.customers), repeatCustomers: num(row.repeatCustomers),
        repeatRate: num(row.customers) ? `${Math.round((num(row.repeatCustomers) / num(row.customers)) * 1000) / 10}٪` : "—",
        revenue: num(row.revenue),
      }));
      return {
        title: "ماندگاری مشتری",
        description: "گروه‌بندی بر اساس ماه اولین خرید؛ خرید مجدد یعنی داشتن حداقل دو سفارش پرداخت‌شده در کل تاریخچه.",
        columns: [
          { key: "cohort", label: "گروه (ماه)" }, { key: "customers", label: "مشتریان", type: "number" },
          { key: "repeatCustomers", label: "خرید مجدد", type: "number" }, { key: "repeatRate", label: "نرخ خرید مجدد" },
          { key: "revenue", label: "درآمد", type: "toman" },
        ],
        rows: resultRows,
        summary: [],
      };
    }
  }
}

export function reportToCsv(result: ReportResult): string {
  const escape = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (/^[=+@]/.test(text) || (/^-/.test(text) && Number.isNaN(Number(text)))) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = result.columns.map((column) => column.label).join(",");
  const lines = result.rows.map((row) => result.columns.map((column) => escape(row[column.key])).join(","));
  return `\uFEFF${header}\n${lines.join("\n")}`;
}

export function reportSearchParams(range: DateRange, type: ReportType, group: ReportGroup) {
  return new URLSearchParams({ type, range: range.key, ...(range.key === "custom" ? { from: toIsoDay(range.from), to: toIsoDay(range.to) } : {}), group }).toString();
}
