import { randomBytes } from "node:crypto";
import { Prisma, type InventoryReason, type PurchaseOrderStatus, type StocktakeStatus } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { Errors } from "@/lib/errors";
import { toDecimalString, toToman } from "@/lib/money";
import { recalcProductStock } from "@/services/catalog";
import { recordInventoryMovement } from "@/services/inventory-ledger";
import {
  purchaseOrderReceiveSchema,
  purchaseOrderSchema,
  purchaseOrderStatusSchema,
  purchaseOrderUpdateSchema,
  stocktakeCountsSchema,
  stocktakeCreateSchema,
  supplierSchema,
  inventoryBulkSchema,
  inventoryVariantUpdateSchema,
} from "@/lib/validation";

type SupplierInput = z.infer<typeof supplierSchema>;
type SupplierUpdateInput = Partial<SupplierInput>;
type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
type PurchaseOrderUpdateInput = z.infer<typeof purchaseOrderUpdateSchema>;
type ReceiveInput = z.infer<typeof purchaseOrderReceiveSchema>;
type PurchaseOrderStatusInput = z.infer<typeof purchaseOrderStatusSchema>;
type StocktakeCreateInput = z.infer<typeof stocktakeCreateSchema>;
type StocktakeCountsInput = z.infer<typeof stocktakeCountsSchema>;
type VariantSettingsInput = z.infer<typeof inventoryVariantUpdateSchema>;
type InventoryBulkInput = z.infer<typeof inventoryBulkSchema>;

function documentNumber(prefix: "PO" | "ST") {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${prefix}-${day}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function like(value: string) {
  return `%${value.replace(/[%_]/g, (match) => `\\${match}`)}%`;
}

function asNumber(value: unknown): number {
  return Number(value ?? 0);
}

export type InventoryStockFilter = "all" | "out" | "low" | "ok";

export interface InventoryListParams {
  page: number;
  pageSize: number;
  q?: string;
  categoryId?: string;
  stock?: InventoryStockFilter;
  sort?: "product" | "stock-asc" | "stock-desc" | "value-desc" | "updated";
}

function inventoryWhere(filters: { q?: string; categoryId?: string; stock?: InventoryStockFilter }) {
  const conditions: Prisma.Sql[] = [Prisma.sql`p.isDeleted = 0`];
  if (filters.q) {
    const needle = like(filters.q);
    conditions.push(Prisma.sql`(v.sku LIKE ${needle} OR v.barcode LIKE ${needle} OR v.location LIKE ${needle} OR p.name LIKE ${needle} OR p.sku LIKE ${needle})`);
  }
  if (filters.categoryId) conditions.push(Prisma.sql`p.categoryId = ${filters.categoryId}`);
  if (filters.stock === "out") conditions.push(Prisma.sql`v.stock = 0`);
  if (filters.stock === "low") conditions.push(Prisma.sql`v.stock > 0 AND v.stock <= v.lowStockThreshold`);
  if (filters.stock === "ok") conditions.push(Prisma.sql`v.stock > v.lowStockThreshold`);
  return Prisma.join(conditions, " AND ");
}

interface InventoryRow {
  id: string;
  sku: string;
  barcode: string | null;
  location: string | null;
  size: string;
  color: string | null;
  stock: unknown;
  lowStockThreshold: unknown;
  costPrice: unknown;
  price: unknown;
  isAvailable: unknown;
  supplierId: string | null;
  supplierName: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  basePrice: unknown;
  salePrice: unknown;
  categoryName: string;
}

function mapInventoryRow(row: InventoryRow) {
  const stock = asNumber(row.stock);
  const cost = row.costPrice === null || row.costPrice === undefined ? null : toToman(row.costPrice as never);
  const retail = toToman(
    (row.price ?? row.salePrice ?? row.basePrice) as never,
  );
  return {
    id: row.id,
    sku: row.sku,
    barcode: row.barcode,
    location: row.location,
    size: row.size,
    color: row.color,
    stock,
    lowStockThreshold: asNumber(row.lowStockThreshold),
    costPrice: cost,
    retailPrice: retail,
    costValue: (cost ?? 0) * stock,
    retailValue: retail * stock,
    isAvailable: Boolean(row.isAvailable),
    supplierId: row.supplierId,
    supplierName: row.supplierName,
    productId: row.productId,
    productName: row.productName,
    productSlug: row.productSlug,
    categoryName: row.categoryName,
    stockStatus: stock === 0 ? "out" : stock <= asNumber(row.lowStockThreshold) ? "low" : "ok",
  };
}

export async function listInventoryVariants(params: InventoryListParams) {
  const order = params.sort === "stock-desc"
    ? Prisma.raw("v.stock DESC, p.name ASC")
    : params.sort === "value-desc"
      ? Prisma.raw("(v.stock * COALESCE(v.costPrice, 0)) DESC, v.stock DESC")
      : params.sort === "product"
        ? Prisma.raw("p.name ASC, v.size ASC")
        : params.sort === "updated"
          ? Prisma.raw("v.updatedAt DESC")
          : Prisma.raw("v.stock ASC, p.name ASC");
  const where = inventoryWhere(params);
  const offset = (params.page - 1) * params.pageSize;
  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<InventoryRow[]>(Prisma.sql`
      SELECT v.id, v.sku, v.barcode, v.location, v.size, v.color, v.stock, v.lowStockThreshold,
             v.costPrice, v.price, v.isAvailable, v.supplierId, s.name AS supplierName,
             p.id AS productId, p.name AS productName, p.slug AS productSlug,
             p.basePrice, p.salePrice, c.name AS categoryName
      FROM ProductVariant v
      JOIN Product p ON p.id = v.productId
      JOIN Category c ON c.id = p.categoryId
      LEFT JOIN Supplier s ON s.id = v.supplierId
      WHERE ${where}
      ORDER BY ${order}
      LIMIT ${params.pageSize} OFFSET ${offset}
    `),
    prisma.$queryRaw<Array<{ total: unknown }>>(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM ProductVariant v
      JOIN Product p ON p.id = v.productId
      JOIN Category c ON c.id = p.categoryId
      WHERE ${where}
    `),
  ]);
  const total = asNumber(countRows[0]?.total);
  return {
    items: rows.map(mapInventoryRow),
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

interface OverviewRow {
  skus: unknown;
  units: unknown;
  costValue: unknown;
  retailValue: unknown;
  outOfStock: unknown;
  lowStock: unknown;
  unavailable: unknown;
}

export async function getInventoryOverview() {
  const [summaryRows, deadStockRows, movementTrend, valueByCategory, openPurchaseOrders, pendingStocktakes] = await Promise.all([
    prisma.$queryRaw<OverviewRow[]>(Prisma.sql`
      SELECT COUNT(*) AS skus,
             COALESCE(SUM(v.stock), 0) AS units,
             COALESCE(SUM(v.stock * COALESCE(v.costPrice, 0)), 0) AS costValue,
             COALESCE(SUM(v.stock * COALESCE(v.price, p.salePrice, p.basePrice)), 0) AS retailValue,
             COALESCE(SUM(CASE WHEN v.stock = 0 THEN 1 ELSE 0 END), 0) AS outOfStock,
             COALESCE(SUM(CASE WHEN v.stock > 0 AND v.stock <= v.lowStockThreshold THEN 1 ELSE 0 END), 0) AS lowStock,
             COALESCE(SUM(CASE WHEN v.isAvailable = 0 THEN 1 ELSE 0 END), 0) AS unavailable
      FROM ProductVariant v
      JOIN Product p ON p.id = v.productId
      WHERE p.isDeleted = 0
    `),
    prisma.$queryRaw<Array<{ total: unknown }>>(Prisma.sql`
      SELECT COUNT(*) AS total
      FROM ProductVariant v
      JOIN Product p ON p.id = v.productId
      WHERE p.isDeleted = 0 AND v.stock > 0 AND NOT EXISTS (
        SELECT 1 FROM InventoryMovement m
        WHERE m.variantId = v.id AND m.reason = 'SALE' AND m.quantity < 0
          AND m.createdAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      )
    `),
    prisma.$queryRaw<Array<{ day: string; incoming: unknown; outgoing: unknown }>>(Prisma.sql`
      SELECT DATE_FORMAT(createdAt, '%Y-%m-%d') AS day,
             COALESCE(SUM(CASE WHEN quantity > 0 THEN quantity ELSE 0 END), 0) AS incoming,
             COALESCE(SUM(CASE WHEN quantity < 0 THEN -quantity ELSE 0 END), 0) AS outgoing
      FROM InventoryMovement
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      GROUP BY day
      ORDER BY day ASC
    `),
    prisma.$queryRaw<Array<{ label: string; value: unknown; units: unknown }>>(Prisma.sql`
      SELECT c.name AS label,
             COALESCE(SUM(v.stock * COALESCE(v.costPrice, 0)), 0) AS value,
             COALESCE(SUM(v.stock), 0) AS units
      FROM ProductVariant v
      JOIN Product p ON p.id = v.productId
      JOIN Category c ON c.id = p.categoryId
      WHERE p.isDeleted = 0
      GROUP BY c.id, c.name
      ORDER BY value DESC
      LIMIT 8
    `),
    prisma.purchaseOrder.count({ where: { status: { in: ["ORDERED", "PARTIAL"] } } }),
    prisma.stocktake.count({ where: { status: { in: ["DRAFT", "IN_PROGRESS"] } } }),
  ]);
  const summary = summaryRows[0];
  const costValue = asNumber(summary?.costValue);
  const retailValue = asNumber(summary?.retailValue);
  return {
    skus: asNumber(summary?.skus),
    units: asNumber(summary?.units),
    costValue,
    retailValue,
    potentialMargin: retailValue - costValue,
    outOfStock: asNumber(summary?.outOfStock),
    lowStock: asNumber(summary?.lowStock),
    unavailable: asNumber(summary?.unavailable),
    deadStock: asNumber(deadStockRows[0]?.total),
    openPurchaseOrders,
    pendingStocktakes,
    movementTrend: movementTrend.map((row) => ({
      day: row.day,
      incoming: asNumber(row.incoming),
      outgoing: asNumber(row.outgoing),
    })),
    valueByCategory: valueByCategory.map((row) => ({
      label: row.label,
      value: asNumber(row.value),
      units: asNumber(row.units),
    })),
  };
}

export async function getInventoryValueSummary() {
  const rows = await prisma.$queryRaw<Array<{ costValue: unknown; retailValue: unknown; units: unknown; skus: unknown }>>(Prisma.sql`
    SELECT COALESCE(SUM(v.stock * COALESCE(v.costPrice, 0)), 0) AS costValue,
           COALESCE(SUM(v.stock * COALESCE(v.price, p.salePrice, p.basePrice)), 0) AS retailValue,
           COALESCE(SUM(v.stock), 0) AS units,
           COUNT(*) AS skus
    FROM ProductVariant v
    JOIN Product p ON p.id = v.productId
    WHERE p.isDeleted = 0
  `);
  const row = rows[0];
  return {
    costValue: asNumber(row?.costValue),
    retailValue: asNumber(row?.retailValue),
    units: asNumber(row?.units),
    skus: asNumber(row?.skus),
  };
}

export interface ReorderSuggestion {
  id: string;
  sku: string;
  productId: string;
  productName: string;
  size: string;
  color: string | null;
  stock: number;
  lowStockThreshold: number;
  soldLast30Days: number;
  supplierId: string | null;
  supplierName: string | null;
  leadTimeDays: number;
  suggestedQuantity: number;
}

export async function getReorderSuggestions(limit = 12): Promise<ReorderSuggestion[]> {
  const rows = await prisma.$queryRaw<Array<{
    id: string; sku: string; productId: string; productName: string; size: string; color: string | null;
    stock: unknown; lowStockThreshold: unknown; sold30: unknown; supplierId: string | null;
    supplierName: string | null; leadTimeDays: unknown;
  }>>(Prisma.sql`
    SELECT v.id, v.sku, p.id AS productId, p.name AS productName, v.size, v.color,
           v.stock, v.lowStockThreshold, COALESCE(sales.qty, 0) AS sold30,
           v.supplierId, s.name AS supplierName, COALESCE(s.leadTimeDays, 14) AS leadTimeDays
    FROM ProductVariant v
    JOIN Product p ON p.id = v.productId
    LEFT JOIN Supplier s ON s.id = v.supplierId
    LEFT JOIN (
      SELECT variantId, SUM(-quantity) AS qty
      FROM InventoryMovement
      WHERE reason = 'SALE' AND quantity < 0 AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY variantId
    ) sales ON sales.variantId = v.id
    WHERE p.isDeleted = 0 AND v.isAvailable = 1 AND v.stock <= v.lowStockThreshold
    ORDER BY v.stock ASC, sold30 DESC
    LIMIT ${limit}
  `);
  return rows.map((row) => {
    const stock = asNumber(row.stock);
    const threshold = asNumber(row.lowStockThreshold);
    const sold = asNumber(row.sold30);
    const leadTime = Math.max(0, asNumber(row.leadTimeDays));
    const daily = sold / 30;
    const coverDays = leadTime + 14;
    const target = Math.ceil(daily * coverDays) + threshold;
    return {
      id: row.id,
      sku: row.sku,
      productId: row.productId,
      productName: row.productName,
      size: row.size,
      color: row.color,
      stock,
      lowStockThreshold: threshold,
      soldLast30Days: sold,
      supplierId: row.supplierId,
      supplierName: row.supplierName,
      leadTimeDays: leadTime,
      suggestedQuantity: Math.max(1, target - stock),
    };
  });
}

export interface DeadStockRow {
  id: string;
  sku: string;
  productId: string;
  productName: string;
  stock: number;
  costValue: number;
  lastSoldAt: Date | null;
}

export async function getDeadStock(limit = 8): Promise<DeadStockRow[]> {
  const rows = await prisma.$queryRaw<Array<{
    id: string; sku: string; productId: string; productName: string; stock: unknown;
    costValue: unknown; lastSoldAt: Date | null;
  }>>(Prisma.sql`
    SELECT v.id, v.sku, p.id AS productId, p.name AS productName, v.stock,
           (v.stock * COALESCE(v.costPrice, 0)) AS costValue,
           (SELECT MAX(m.createdAt) FROM InventoryMovement m
            WHERE m.variantId = v.id AND m.reason = 'SALE' AND m.quantity < 0) AS lastSoldAt
    FROM ProductVariant v
    JOIN Product p ON p.id = v.productId
    WHERE p.isDeleted = 0 AND v.stock > 0 AND NOT EXISTS (
      SELECT 1 FROM InventoryMovement m
      WHERE m.variantId = v.id AND m.reason = 'SALE' AND m.quantity < 0
        AND m.createdAt >= DATE_SUB(NOW(), INTERVAL 90 DAY)
    )
    ORDER BY costValue DESC
    LIMIT ${limit}
  `);
  return rows.map((row) => ({
    id: row.id,
    sku: row.sku,
    productId: row.productId,
    productName: row.productName,
    stock: asNumber(row.stock),
    costValue: asNumber(row.costValue),
    lastSoldAt: row.lastSoldAt ? new Date(row.lastSoldAt) : null,
  }));
}

export async function updateVariantSettings(variantId: string, input: VariantSettingsInput, actorId: string) {
  const existing = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { id: true, barcode: true, location: true, costPrice: true, lowStockThreshold: true, isAvailable: true, supplierId: true, productId: true },
  });
  if (!existing) throw Errors.notFound("تنوع یافت نشد");
  if (input.barcode) {
    const duplicate = await prisma.productVariant.findFirst({
      where: { barcode: input.barcode, id: { not: variantId } },
      select: { id: true },
    });
    if (duplicate) throw Errors.conflict("این بارکد برای تنوع دیگری ثبت شده است");
  }
  if (input.supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId }, select: { id: true } });
    if (!supplier) throw Errors.badRequest("تأمین‌کننده یافت نشد");
  }
  const data: Prisma.ProductVariantUpdateInput = {};
  if (input.barcode !== undefined) data.barcode = input.barcode || null;
  if (input.location !== undefined) data.location = input.location || null;
  if (input.costPrice !== undefined) data.costPrice = input.costPrice === null ? null : toDecimalString(input.costPrice);
  if (input.lowStockThreshold !== undefined) data.lowStockThreshold = input.lowStockThreshold;
  if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable;
  if (input.supplierId !== undefined) data.supplier = input.supplierId ? { connect: { id: input.supplierId } } : { disconnect: true };
  const updated = await prisma.productVariant.update({
    where: { id: variantId },
    data,
    select: { id: true, barcode: true, location: true, costPrice: true, lowStockThreshold: true, isAvailable: true, supplierId: true },
  });
  await audit({
    actorId,
    action: "inventory.variant_settings_updated",
    entity: "ProductVariant",
    entityId: variantId,
    before: { ...existing, costPrice: existing.costPrice ? toToman(existing.costPrice) : null },
    after: { ...updated, costPrice: updated.costPrice ? toToman(updated.costPrice) : null },
  });
  return updated;
}

export async function bulkAdjustStock(input: InventoryBulkInput, actorId: string) {
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: input.ids }, product: { isDeleted: false } },
    select: { id: true, sku: true, stock: true, productId: true },
  });
  if (variants.length !== input.ids.length) throw Errors.badRequest("برخی تنوع‌های انتخاب‌شده یافت نشدند");
  const result = await prisma.$transaction(async (tx) => {
    const productIds = new Set<string>();
    let updated = 0;
    for (const variant of variants) {
      const next = input.mode === "set" ? input.quantity : variant.stock + input.quantity;
      if (next < 0) throw Errors.conflict(`موجودی ${variant.sku} نمی‌تواند منفی شود`);
      const delta = next - variant.stock;
      if (delta === 0) continue;
      if (input.reason === "DAMAGE" && delta > 0) {
        throw Errors.badRequest("برای ثبت ضایعات، موجودی باید کاهش یابد");
      }
      await tx.productVariant.update({ where: { id: variant.id }, data: { stock: next } });
      await recordInventoryMovement(tx, {
        variantId: variant.id,
        quantity: delta,
        reason: input.reason,
        note: input.note ?? "به‌روزرسانی گروهی موجودی انبار",
        userId: actorId,
        referenceType: "BULK_ADJUSTMENT",
      });
      productIds.add(variant.productId);
      updated += 1;
    }
    for (const productId of productIds) await recalcProductStock(tx, productId);
    return { updated };
  });
  await audit({
    actorId,
    action: "inventory.bulk_adjusted",
    entity: "ProductVariant",
    metadata: { ids: input.ids, mode: input.mode, quantity: input.quantity, reason: input.reason, updated: result.updated },
    severity: "warn",
  });
  return result;
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export async function listSuppliers(params?: { q?: string; includeInactive?: boolean }) {
  const where: Prisma.SupplierWhereInput = {
    ...(params?.includeInactive ? {} : { isActive: true }),
    ...(params?.q ? { OR: [{ name: { contains: params.q } }, { contactName: { contains: params.q } }, { phone: { contains: params.q } }] } : {}),
  };
  return prisma.supplier.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { variants: true, purchaseOrders: true } },
      purchaseOrders: { where: { status: { in: ["ORDERED", "PARTIAL"] } }, select: { id: true } },
    },
  });
}

export async function createSupplier(input: SupplierInput, actorId: string) {
  if (await prisma.supplier.findUnique({ where: { name: input.name } })) throw Errors.conflict("تأمین‌کننده با این نام وجود دارد");
  const supplier = await prisma.supplier.create({ data: { ...input } });
  await audit({ actorId, action: "supplier.created", entity: "Supplier", entityId: supplier.id, metadata: { name: supplier.name } });
  return supplier;
}

export async function updateSupplier(id: string, input: SupplierUpdateInput, actorId: string) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("تأمین‌کننده یافت نشد");
  if (input.name && input.name !== existing.name) {
    const duplicate = await prisma.supplier.findUnique({ where: { name: input.name }, select: { id: true } });
    if (duplicate) throw Errors.conflict("تأمین‌کننده با این نام وجود دارد");
  }
  const updated = await prisma.supplier.update({ where: { id }, data: input });
  await audit({ actorId, action: "supplier.updated", entity: "Supplier", entityId: id, before: existing, after: updated });
  return updated;
}

export async function deleteSupplier(id: string, actorId: string) {
  const [purchaseOrders, variants] = await Promise.all([
    prisma.purchaseOrder.count({ where: { supplierId: id } }),
    prisma.productVariant.count({ where: { supplierId: id } }),
  ]);
  if (purchaseOrders) throw Errors.conflict("این تأمین‌کننده سفارش خرید دارد و قابل حذف نیست؛ آن را غیرفعال کنید");
  await prisma.$transaction(async (tx) => {
    if (variants) await tx.productVariant.updateMany({ where: { supplierId: id }, data: { supplierId: null } });
    await tx.supplier.delete({ where: { id } });
  });
  await audit({ actorId, action: "supplier.deleted", entity: "Supplier", entityId: id, metadata: { variantsDetached: variants }, severity: "warn" });
}

// ---------------------------------------------------------------------------
// Purchase orders
// ---------------------------------------------------------------------------

function purchaseTotals(items: Array<{ quantity: number; unitCost: number }>, discountAmount: number, shippingCost: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  const discount = Math.min(subtotal, Math.max(0, discountAmount));
  return { subtotal, discount, shipping: Math.max(0, shippingCost), total: subtotal - discount + Math.max(0, shippingCost) };
}

export async function listPurchaseOrders(params: { page: number; pageSize: number; status?: PurchaseOrderStatus; q?: string }) {
  const where: Prisma.PurchaseOrderWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.q ? { OR: [
      { number: { contains: params.q } },
      { supplier: { name: { contains: params.q } } },
      { items: { some: { variant: { OR: [{ sku: { contains: params.q } }, { product: { name: { contains: params.q } } }] } } } },
    ] } : {}),
  };
  const [total, rows] = await prisma.$transaction([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { select: { quantity: true, receivedQuantity: true, unitCost: true } },
      },
    }),
  ]);
  return {
    items: rows.map((order) => ({
      id: order.id,
      number: order.number,
      supplier: order.supplier,
      status: order.status,
      expectedAt: order.expectedAt,
      receivedAt: order.receivedAt,
      createdAt: order.createdAt,
      note: order.note,
      total: toToman(order.totalAmount),
      units: order.items.reduce((sum, item) => sum + item.quantity, 0),
      receivedUnits: order.items.reduce((sum, item) => sum + item.receivedQuantity, 0),
      lines: order.items.length,
    })),
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function getPurchaseOrder(id: string) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          variant: {
            select: {
              id: true, sku: true, size: true, color: true, stock: true, costPrice: true,
              product: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  });
  if (!order) throw Errors.notFound("سفارش خرید یافت نشد");
  return {
    ...order,
    subtotal: toToman(order.subtotal),
    discountAmount: toToman(order.discountAmount),
    shippingCost: toToman(order.shippingCost),
    totalAmount: toToman(order.totalAmount),
    items: order.items.map((item) => ({
      ...item,
      unitCost: toToman(item.unitCost),
      lineTotal: toToman(item.unitCost) * item.quantity,
      remaining: item.quantity - item.receivedQuantity,
      variant: {
        ...item.variant,
        costPrice: item.variant.costPrice ? toToman(item.variant.costPrice) : null,
      },
    })),
  };
}

async function assertVariantsExist(items: Array<{ variantId: string }>) {
  const ids = items.map((item) => item.variantId);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids }, product: { isDeleted: false } },
    select: { id: true },
  });
  if (variants.length !== ids.length) throw Errors.badRequest("برخی تنوع‌های انتخاب‌شده یافت نشدند");
}

export async function createPurchaseOrder(input: PurchaseOrderInput, actorId: string) {
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId }, select: { id: true, isActive: true } });
  if (!supplier || !supplier.isActive) throw Errors.badRequest("تأمین‌کننده معتبر و فعال انتخاب کنید");
  await assertVariantsExist(input.items);
  const totals = purchaseTotals(input.items, input.discountAmount, input.shippingCost);
  const order = await prisma.purchaseOrder.create({
    data: {
      number: documentNumber("PO"),
      supplierId: input.supplierId,
      status: "DRAFT",
      expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
      note: input.note ?? null,
      subtotal: toDecimalString(totals.subtotal),
      discountAmount: toDecimalString(totals.discount),
      shippingCost: toDecimalString(totals.shipping),
      totalAmount: toDecimalString(totals.total),
      createdById: actorId,
      items: {
        create: input.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitCost: toDecimalString(item.unitCost),
          note: item.note ?? null,
        })),
      },
    },
    select: { id: true, number: true },
  });
  await audit({ actorId, action: "purchase_order.created", entity: "PurchaseOrder", entityId: order.id, metadata: { number: order.number, total: totals.total } });
  return order;
}

export async function updatePurchaseOrder(id: string, input: PurchaseOrderUpdateInput, actorId: string) {
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { select: { quantity: true, unitCost: true } } },
  });
  if (!existing) throw Errors.notFound("سفارش خرید یافت نشد");
  if (existing.status !== "DRAFT") throw Errors.conflict("فقط پیش‌نویس سفارش خرید قابل ویرایش است");
  if (input.supplierId) {
    const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId }, select: { isActive: true } });
    if (!supplier?.isActive) throw Errors.badRequest("تأمین‌کننده معتبر و فعال انتخاب کنید");
  }
  if (input.items) await assertVariantsExist(input.items);
  const discount = input.discountAmount ?? toToman(existing.discountAmount);
  const shipping = input.shippingCost ?? toToman(existing.shippingCost);
  const items = input.items ?? existing.items.map((item) => ({ quantity: item.quantity, unitCost: toToman(item.unitCost) }));
  const totals = purchaseTotals(items, discount, shipping);
  await prisma.$transaction(async (tx) => {
    if (input.items) {
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
      await tx.purchaseOrderItem.createMany({
        data: input.items.map((item) => ({
          purchaseOrderId: id,
          variantId: item.variantId,
          quantity: item.quantity,
          unitCost: toDecimalString(item.unitCost),
          note: item.note ?? null,
        })),
      });
    }
    await tx.purchaseOrder.update({
      where: { id },
      data: {
        ...(input.supplierId ? { supplierId: input.supplierId } : {}),
        ...(input.expectedAt !== undefined ? { expectedAt: input.expectedAt ? new Date(input.expectedAt) : null } : {}),
        ...(input.note !== undefined ? { note: input.note ?? null } : {}),
        subtotal: toDecimalString(totals.subtotal),
        discountAmount: toDecimalString(totals.discount),
        shippingCost: toDecimalString(totals.shipping),
        totalAmount: toDecimalString(totals.total),
      },
    });
  });
  await audit({ actorId, action: "purchase_order.updated", entity: "PurchaseOrder", entityId: id, before: { status: existing.status }, after: { total: totals.total } });
  return { id };
}

export async function setPurchaseOrderStatus(id: string, input: PurchaseOrderStatusInput, actorId: string) {
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: { select: { receivedQuantity: true } } },
  });
  if (!existing) throw Errors.notFound("سفارش خرید یافت نشد");
  if (input.status === "ORDERED") {
    if (existing.status !== "DRAFT") throw Errors.conflict("فقط پیش‌نویس قابل ثبت است");
    if (!existing.items.length) throw Errors.conflict("سفارش خرید بدون قلم کالا قابل ثبت نیست");
  }
  if (input.status === "CANCELLED") {
    if (!["DRAFT", "ORDERED"].includes(existing.status)) throw Errors.conflict("این سفارش خرید قابل لغو نیست");
    if (existing.items.some((item) => item.receivedQuantity > 0)) throw Errors.conflict("سفارش دارای کالای دریافت‌شده قابل لغو نیست");
  }
  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: { status: input.status, ...(input.note ? { note: input.note } : {}) },
    select: { id: true, number: true, status: true },
  });
  await audit({ actorId, action: `purchase_order.${input.status.toLowerCase()}`, entity: "PurchaseOrder", entityId: id, metadata: { number: existing.number } });
  return updated;
}

export async function receivePurchaseOrder(id: string, input: ReceiveInput, actorId: string) {
  let receivedUnits = 0;
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw Errors.notFound("سفارش خرید یافت نشد");
    if (!["ORDERED", "PARTIAL"].includes(order.status)) throw Errors.conflict("این سفارش خرید در وضعیت قابل دریافت نیست");
    const byId = new Map(order.items.map((item) => [item.id, item]));
    const productIds = new Set<string>();
    for (const line of input.items) {
      if (line.quantity <= 0) continue;
      const item = byId.get(line.itemId);
      if (!item) throw Errors.badRequest("قلم سفارش خرید یافت نشد");
      const remaining = item.quantity - item.receivedQuantity;
      if (line.quantity > remaining) {
        throw Errors.conflict(`مقدار دریافتی بیشتر از باقی‌مانده سفارش است (${remaining} عدد)`);
      }
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true, costPrice: true, productId: true },
      });
      if (!variant) throw Errors.badRequest("تنوع کالای سفارش یافت نشد");
      const unitCost = toToman(item.unitCost);
      const nextStock = variant.stock + line.quantity;
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: nextStock } });
      const currentCost = variant.costPrice ? toToman(variant.costPrice) : 0;
      const weightedCost = variant.stock > 0 && currentCost > 0
        ? Math.round(((variant.stock * currentCost) + (line.quantity * unitCost)) / (variant.stock + line.quantity))
        : unitCost;
      await tx.productVariant.update({ where: { id: item.variantId }, data: { costPrice: toDecimalString(weightedCost) } });
      await recordInventoryMovement(tx, {
        variantId: item.variantId,
        quantity: line.quantity,
        reason: "PURCHASE",
        unitCost,
        note: `رسید سفارش خرید ${order.number}`,
        userId: actorId,
        referenceType: "PURCHASE_ORDER",
        referenceId: id,
      });
      const updatedItem = await tx.purchaseOrderItem.updateMany({
        where: { id: item.id, receivedQuantity: item.receivedQuantity },
        data: { receivedQuantity: { increment: line.quantity } },
      });
      if (!updatedItem.count) throw Errors.conflict("این قلم هم‌زمان توسط کاربر دیگری به‌روزرسانی شد؛ دوباره تلاش کنید");
      productIds.add(variant.productId);
      receivedUnits += line.quantity;
    }
    if (receivedUnits === 0) throw Errors.badRequest("حداقل یک مقدار دریافتی وارد کنید");
    const refreshed = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id }, select: { quantity: true, receivedQuantity: true } });
    const fullyReceived = refreshed.every((item) => item.receivedQuantity >= item.quantity);
    const updated = await tx.purchaseOrder.update({
      where: { id },
      data: {
        status: fullyReceived ? "RECEIVED" : "PARTIAL",
        ...(fullyReceived ? { receivedAt: new Date() } : {}),
      },
      select: { id: true, number: true, status: true },
    });
    for (const productId of productIds) await recalcProductStock(tx, productId);
    return updated;
  });
  await audit({
    actorId,
    action: "purchase_order.received",
    entity: "PurchaseOrder",
    entityId: id,
    metadata: { units: receivedUnits, status: result.status },
  });
  return { ...result, receivedUnits };
}

// ---------------------------------------------------------------------------
// Stocktakes
// ---------------------------------------------------------------------------

export async function listStocktakes(params: { page: number; pageSize: number; status?: StocktakeStatus }) {
  const where: Prisma.StocktakeWhereInput = params.status ? { status: params.status } : {};
  const [total, rows] = await prisma.$transaction([
    prisma.stocktake.count({ where }),
    prisma.stocktake.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        _count: { select: { items: true } },
        items: { select: { countedQuantity: true, difference: true } },
      },
    }),
  ]);
  return {
    items: rows.map((stocktake) => {
      const counted = stocktake.items.filter((item) => item.countedQuantity !== null);
      const differences = stocktake.items.filter((item) => (item.difference ?? 0) !== 0);
      return {
        id: stocktake.id,
        number: stocktake.number,
        status: stocktake.status,
        note: stocktake.note,
        startedAt: stocktake.startedAt,
        completedAt: stocktake.completedAt,
        createdAt: stocktake.createdAt,
        totalItems: stocktake._count.items,
        countedItems: counted.length,
        varianceItems: differences.length,
        varianceUnits: differences.reduce((sum, item) => sum + (item.difference ?? 0), 0),
      };
    }),
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function createStocktake(input: StocktakeCreateInput, actorId: string) {
  const conditions: Prisma.Sql[] = [Prisma.sql`p.isDeleted = 0`];
  if (input.scope === "LOW_STOCK") conditions.push(Prisma.sql`v.stock <= v.lowStockThreshold`);
  if (input.scope === "CATEGORY" && input.categoryId) conditions.push(Prisma.sql`p.categoryId = ${input.categoryId}`);
  const variants = await prisma.$queryRaw<Array<{ id: string; stock: unknown }>>(Prisma.sql`
    SELECT v.id, v.stock
    FROM ProductVariant v
    JOIN Product p ON p.id = v.productId
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY p.name ASC, v.size ASC
    LIMIT 3000
  `);
  if (!variants.length) throw Errors.conflict("تنوعی برای شمارش یافت نشد");
  const stocktake = await prisma.stocktake.create({
    data: {
      number: documentNumber("ST"),
      status: "IN_PROGRESS",
      note: input.note ?? null,
      createdById: actorId,
      items: {
        createMany: {
          data: variants.map((variant) => ({ variantId: variant.id, expectedQuantity: asNumber(variant.stock) })),
        },
      },
    },
    select: { id: true, number: true },
  });
  await audit({ actorId, action: "stocktake.created", entity: "Stocktake", entityId: stocktake.id, metadata: { number: stocktake.number, scope: input.scope, items: variants.length } });
  return stocktake;
}

export async function getStocktake(id: string, params: { page: number; pageSize: number; q?: string }) {
  const stocktake = await prisma.stocktake.findUnique({
    where: { id },
    include: { _count: { select: { items: true } }, items: { select: { countedQuantity: true, difference: true } } },
  });
  if (!stocktake) throw Errors.notFound("انبارگردانی یافت نشد");
  const where: Prisma.StocktakeItemWhereInput = {
    stocktakeId: id,
    ...(params.q ? {
      OR: [
        { variant: { sku: { contains: params.q } } },
        { variant: { barcode: { contains: params.q } } },
        { variant: { product: { name: { contains: params.q } } } },
      ],
    } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.stocktakeItem.count({ where }),
    prisma.stocktakeItem.findMany({
      where,
      orderBy: [{ countedQuantity: "asc" }, { id: "asc" }],
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        variant: {
          select: {
            id: true, sku: true, barcode: true, location: true, size: true, color: true, stock: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);
  const counted = stocktake.items.filter((item) => item.countedQuantity !== null);
  const differences = stocktake.items.filter((item) => (item.difference ?? 0) !== 0);
  return {
    stocktake: {
      id: stocktake.id,
      number: stocktake.number,
      status: stocktake.status,
      note: stocktake.note,
      startedAt: stocktake.startedAt,
      completedAt: stocktake.completedAt,
      totalItems: stocktake._count.items,
      countedItems: counted.length,
      varianceItems: differences.length,
      varianceUnits: differences.reduce((sum, item) => sum + (item.difference ?? 0), 0),
    },
    items: items.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      expectedQuantity: item.expectedQuantity,
      countedQuantity: item.countedQuantity,
      difference: item.difference,
      currentStock: item.variant.stock,
      variant: item.variant,
    })),
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function saveStocktakeCounts(id: string, input: StocktakeCountsInput, actorId: string) {
  const stocktake = await prisma.stocktake.findUnique({ where: { id }, select: { id: true, status: true, number: true } });
  if (!stocktake) throw Errors.notFound("انبارگردانی یافت نشد");
  if (!["DRAFT", "IN_PROGRESS"].includes(stocktake.status)) throw Errors.conflict("این انبارگردانی قابل ویرایش نیست");
  const ids = input.counts.map((count) => count.itemId);
  const items = await prisma.stocktakeItem.findMany({
    where: { id: { in: ids }, stocktakeId: id },
    select: { id: true, expectedQuantity: true },
  });
  if (items.length !== ids.length) throw Errors.badRequest("برخی اقلام شمارش یافت نشدند");
  const byId = new Map(items.map((item) => [item.id, item]));
  await prisma.$transaction(async (tx) => {
    for (const count of input.counts) {
      const item = byId.get(count.itemId);
      if (!item) continue;
      await tx.stocktakeItem.update({
        where: { id: count.itemId },
        data: { countedQuantity: count.countedQuantity, difference: count.countedQuantity - item.expectedQuantity },
      });
    }
    if (stocktake.status === "DRAFT") await tx.stocktake.update({ where: { id }, data: { status: "IN_PROGRESS" } });
  });
  await audit({ actorId, action: "stocktake.counts_saved", entity: "Stocktake", entityId: id, metadata: { number: stocktake.number, counts: input.counts.length } });
  return { saved: input.counts.length };
}

export async function completeStocktake(id: string, actorId: string) {
  const summary = await prisma.$transaction(async (tx) => {
    const stocktake = await tx.stocktake.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!stocktake) throw Errors.notFound("انبارگردانی یافت نشد");
    if (stocktake.status === "COMPLETED") throw Errors.conflict("این انبارگردانی قبلاً تکمیل شده است");
    if (stocktake.status === "CANCELLED") throw Errors.conflict("انبارگردانی لغو شده قابل تکمیل نیست");
    const counted = stocktake.items.filter((item) => item.countedQuantity !== null);
    if (!counted.length) throw Errors.conflict("هیچ شمارشی ثبت نشده است");
    const productIds = new Set<string>();
    let adjusted = 0;
    let movedUnits = 0;
    for (const item of counted) {
      const variance = (item.countedQuantity ?? 0) - item.expectedQuantity;
      if (variance === 0) continue;
      const variant = await tx.productVariant.findUnique({
        where: { id: item.variantId },
        select: { stock: true, productId: true, sku: true },
      });
      if (!variant) continue;
      // Apply the variance, not an absolute overwrite, so sales received after
      // the snapshot are preserved. If the variance would drive stock below
      // zero, clamp to zero and record the effective delta.
      const next = Math.max(0, variant.stock + variance);
      const delta = next - variant.stock;
      if (delta === 0) continue;
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: next } });
      await recordInventoryMovement(tx, {
        variantId: item.variantId,
        quantity: delta,
        reason: "STOCKTAKE",
        note: `انبارگردانی ${stocktake.number} — شمارش ${item.countedQuantity}، سیستم ${item.expectedQuantity}`,
        userId: actorId,
        referenceType: "STOCKTAKE",
        referenceId: id,
      });
      productIds.add(variant.productId);
      adjusted += 1;
      movedUnits += Math.abs(delta);
    }
    for (const productId of productIds) await recalcProductStock(tx, productId);
    await tx.stocktake.update({ where: { id }, data: { status: "COMPLETED", completedAt: new Date() } });
    return { adjusted, movedUnits, counted: counted.length };
  });
  await audit({ actorId, action: "stocktake.completed", entity: "Stocktake", entityId: id, metadata: summary, severity: "warn" });
  return summary;
}

export async function setStocktakeStatus(id: string, input: { status: "IN_PROGRESS" | "CANCELLED"; note?: string }, actorId: string) {
  const stocktake = await prisma.stocktake.findUnique({ where: { id }, select: { id: true, status: true, number: true } });
  if (!stocktake) throw Errors.notFound("انبارگردانی یافت نشد");
  if (!["DRAFT", "IN_PROGRESS"].includes(stocktake.status)) throw Errors.conflict("این انبارگردانی قابل تغییر نیست");
  const updated = await prisma.stocktake.update({
    where: { id },
    data: { status: input.status, ...(input.note ? { note: input.note } : {}) },
    select: { id: true, status: true, number: true },
  });
  await audit({ actorId, action: `stocktake.${input.status.toLowerCase()}`, entity: "Stocktake", entityId: id, metadata: { number: stocktake.number } });
  return updated;
}

// ---------------------------------------------------------------------------
// Ledger + export
// ---------------------------------------------------------------------------

export async function listMovements(params: {
  page: number;
  pageSize: number;
  q?: string;
  reason?: string;
  referenceType?: string;
}) {
  const where: Prisma.InventoryMovementWhereInput = {
    ...(params.reason ? { reason: params.reason as InventoryReason } : {}),
    ...(params.referenceType ? { referenceType: params.referenceType } : {}),
    ...(params.q ? { variant: { OR: [
      { sku: { contains: params.q } },
      { barcode: { contains: params.q } },
      { product: { name: { contains: params.q } } },
      { product: { sku: { contains: params.q } } },
    ] } } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      include: {
        variant: {
          select: {
            id: true, sku: true, barcode: true, size: true, color: true,
            product: { select: { id: true, name: true, slug: true } },
          },
        },
        order: { select: { id: true, orderNumber: true } },
      },
    }),
  ]);
  return {
    items,
    total,
    page: params.page,
    pageCount: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}

export async function exportInventoryCsv(filters: { q?: string; categoryId?: string; stock?: InventoryStockFilter }) {
  const { items } = await listInventoryVariants({ page: 1, pageSize: 5000, ...filters, sort: "product" });
  const escape = (value: unknown) => {
    let text = value === null || value === undefined ? "" : String(value);
    if (/^[=+@]/.test(text) || (/^-/.test(text) && Number.isNaN(Number(text)))) text = `'${text}`;
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = ["محصول", "SKU", "بارکد", "قفسه", "سایز", "رنگ", "دسته‌بندی", "تأمین‌کننده", "موجودی", "آستانه", "بهای خرید", "قیمت فروش", "ارزش موجودی (خرید)", "ارزش فروش", "وضعیت"];
  const statusLabel: Record<string, string> = { out: "ناموجود", low: "کم", ok: "مناسب" };
  const lines = items.map((item) => [
    item.productName, item.sku, item.barcode, item.location, item.size, item.color,
    item.categoryName, item.supplierName, item.stock, item.lowStockThreshold,
    item.costPrice, item.retailPrice, item.costValue, item.retailValue, statusLabel[item.stockStatus],
  ].map(escape).join(","));
  return `\uFEFF${header.join(",")}\n${lines.join("\n")}`;
}

export async function getInventoryFilterOptions() {
  const [categories, suppliers] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.supplier.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return { categories, suppliers };
}
