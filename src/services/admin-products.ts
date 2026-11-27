import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { toDecimalString, toToman } from "@/lib/money";
import { recalcProductStock } from "@/services/catalog";
import { recordInventoryMovement } from "@/services/inventory-ledger";

export type BulkProductAction =
  | { action: "status"; ids: string[]; status: "DRAFT" | "ACTIVE" | "INACTIVE" | "DISCONTINUED" }
  | { action: "price"; ids: string[]; mode: "set" | "percent"; value: number }
  | { action: "stock"; ids: string[]; mode: "set" | "increment"; value: number }
  | { action: "archive"; ids: string[] }
  | { action: "feature"; ids: string[]; isFeatured: boolean };

export async function bulkProductAction(input: BulkProductAction, actorId: string) {
  const products = await prisma.product.findMany({
    where: { id: { in: input.ids }, isDeleted: false },
    select: { id: true, name: true, basePrice: true, salePrice: true, status: true, isFeatured: true },
  });
  if (products.length !== input.ids.length) throw Errors.badRequest("برخی محصولات یافت نشدند");

  if (input.action === "status") {
    await prisma.product.updateMany({ where: { id: { in: input.ids } }, data: { status: input.status } });
  } else if (input.action === "feature") {
    await prisma.product.updateMany({ where: { id: { in: input.ids } }, data: { isFeatured: input.isFeatured } });
  } else if (input.action === "archive") {
    await prisma.product.updateMany({
      where: { id: { in: input.ids } },
      data: { isDeleted: true, deletedAt: new Date(), status: "DISCONTINUED" },
    });
  } else if (input.action === "price") {
    await prisma.$transaction(async (tx) => {
      for (const product of products) {
        const current = toToman(product.basePrice);
        const next = input.mode === "set"
          ? Math.max(0, Math.round(input.value))
          : Math.max(0, Math.round(current * (1 + input.value / 100)));
        const sale = product.salePrice ? toToman(product.salePrice) : null;
        await tx.product.update({
          where: { id: product.id },
          data: { basePrice: toDecimalString(next), ...(sale !== null && sale >= next ? { salePrice: null } : {}) },
        });
      }
    });
  } else {
    await prisma.$transaction(async (tx) => {
      for (const product of products) {
        const variants = await tx.productVariant.findMany({ where: { productId: product.id }, select: { id: true, stock: true } });
        for (const variant of variants) {
          const next = input.mode === "set" ? Math.max(0, Math.round(input.value)) : Math.max(0, variant.stock + Math.round(input.value));
          if (next === variant.stock) continue;
          await tx.productVariant.update({ where: { id: variant.id }, data: { stock: next } });
          await recordInventoryMovement(tx, {
            variantId: variant.id,
            quantity: next - variant.stock,
            reason: input.mode === "set" ? "ADJUSTMENT" : "RESTOCK",
            note: "به‌روزرسانی گروهی موجودی",
            userId: actorId,
            referenceType: "BULK_ADJUSTMENT",
          });
        }
        await recalcProductStock(tx, product.id);
      }
    });
  }

  await audit({
    actorId,
    action: `product.bulk_${input.action}`,
    entity: "Product",
    severity: input.action === "archive" ? "critical" : "info",
    metadata: { count: input.ids.length, ...input },
    before: products.map((product) => ({ id: product.id, basePrice: toToman(product.basePrice), status: product.status, isFeatured: product.isFeatured })),
  });
  return { affected: input.ids.length };
}

export async function duplicateProduct(id: string, actorId: string) {
  const source = await prisma.product.findUnique({
    where: { id },
    include: { images: true, variants: true },
  });
  if (!source) throw Errors.notFound("محصول یافت نشد");
  const suffix = Date.now().toString(36).slice(-5);
  const slug = `${source.slug}-copy-${suffix}`;
  const sku = `${source.sku}-C${suffix}`.slice(0, 64);
  const copy = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: `${source.name} (کپی)`,
        slug,
        sku,
        searchText: source.searchText,
        description: source.description,
        shortDescription: source.shortDescription,
        categoryId: source.categoryId,
        brandId: source.brandId,
        basePrice: source.basePrice,
        salePrice: source.salePrice,
        currency: source.currency,
        status: "DRAFT",
        isFeatured: false,
        isNewArrival: false,
        gender: source.gender,
        season: source.season,
        material: source.material,
        fabricComposition: source.fabricComposition,
        careInstructions: source.careInstructions,
        reorderLevel: source.reorderLevel,
        heroImage: source.heroImage,
        metaTitle: source.metaTitle,
        metaDescription: source.metaDescription,
        images: {
          create: source.images.map((image) => ({
            url: image.url, altText: image.altText, color: image.color,
            displayOrder: image.displayOrder, isPrimary: image.isPrimary,
          })),
        },
        variants: {
          create: source.variants.map((variant, index) => ({
            size: variant.size, color: variant.color,
            sku: `${sku}-${index + 1}`.slice(0, 64),
            price: variant.price, stock: 0, lowStockThreshold: variant.lowStockThreshold, isAvailable: true,
          })),
        },
      },
      select: { id: true },
    });
    await tx.product.update({ where: { id: created.id }, data: { totalStock: 0, availableStock: 0 } });
    return created;
  });
  await audit({ actorId, action: "product.duplicated", entity: "Product", entityId: copy.id, metadata: { sourceId: id, slug } });
  return copy;
}
