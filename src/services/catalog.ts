import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { discountPercent, effectivePrice, toToman } from "@/lib/money";
import { normalizeForSearch } from "@/lib/persian";
import type { CategoryInput, ProductInput, VariantInput } from "@/services/types";

export function makeSlug(value: string): string {
  const base = value.toLowerCase().trim()
    .replace(/[^\p{Script=Latin}\d]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || `ilkaii-${Date.now().toString(36)}`;
}

async function searchTextFor(data: { name: string; sku: string; description?: string; categoryId: string; colors?: string[] }) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId }, select: { name: true } });
  return normalizeForSearch([data.name, data.sku, data.description ?? "", category?.name ?? "", ...(data.colors ?? [])].join(" "))
    .slice(0, 500);
}

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  price: number;
  basePrice: number;
  discount: number;
  image: string | null;
  category: string;
  isNewArrival: boolean;
  isFeatured: boolean;
  available: boolean;
  rating: number;
}

function toCard(product: {
  id: string; slug: string; name: string; basePrice: Prisma.Decimal; salePrice: Prisma.Decimal | null;
  availableStock: number; isNewArrival: boolean; isFeatured: boolean; averageRating: Prisma.Decimal | null;
  images: { url: string }[]; category: { name: string };
}): ProductCard {
  const base = toToman(product.basePrice);
  const sale = product.salePrice ? toToman(product.salePrice) : null;
  const price = effectivePrice(base, sale);
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price,
    basePrice: base,
    discount: discountPercent(base, price),
    image: product.images[0]?.url ?? null,
    category: product.category.name,
    isNewArrival: product.isNewArrival,
    isFeatured: product.isFeatured,
    available: product.availableStock > 0,
    rating: product.averageRating ? Number(product.averageRating) : 0,
  };
}

const cardSelect = {
  id: true, slug: true, name: true, basePrice: true, salePrice: true, availableStock: true,
  isNewArrival: true, isFeatured: true, averageRating: true,
  images: { where: { isPrimary: true }, take: 1, orderBy: { displayOrder: "asc" as const }, select: { url: true } },
  category: { select: { name: true } },
} satisfies Prisma.ProductSelect;

export async function listProducts(query: {
  page: number; pageSize: number; q?: string; category?: string; size?: string; color?: string;
  minPrice?: number; maxPrice?: number;
  sort: "newest" | "price-asc" | "price-desc" | "popular" | "name";
  available?: string; featured?: string; newArrival?: string;
}) {
  const where: Prisma.ProductWhereInput = { isDeleted: false, status: "ACTIVE" };
  if (query.q) {
    const normalized = normalizeForSearch(query.q);
    where.OR = [
      { name: { contains: query.q } },
      { searchText: { contains: normalized } },
      { sku: { contains: query.q } },
    ];
  }
  if (query.category) where.category = { slug: query.category };
  if (query.size || query.color) {
    where.variants = {
      some: {
        ...(query.size ? { size: query.size } : {}),
        ...(query.color ? { color: { contains: query.color } } : {}),
        isAvailable: true,
      },
    };
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.basePrice = {
      ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
      ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
    };
  }
  if (query.available === "true") where.availableStock = { gt: 0 };
  if (query.featured === "true") where.isFeatured = true;
  if (query.newArrival === "true") where.isNewArrival = true;

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    query.sort === "price-asc" ? { basePrice: "asc" } :
    query.sort === "price-desc" ? { basePrice: "desc" } :
    query.sort === "name" ? { name: "asc" } :
    query.sort === "popular" ? { orderItems: { _count: "desc" } } : { createdAt: "desc" };

  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: cardSelect,
    }),
  ]);
  return {
    items: rows.map(toCard),
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isDeleted: false, status: "ACTIVE" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true } },
      images: { orderBy: { displayOrder: "asc" } },
      variants: { orderBy: [{ color: "asc" }, { size: "asc" }] },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { firstName: true, lastName: true } } },
      },
    },
  });
  if (!product) throw Errors.notFound("محصول یافت نشد");
  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isDeleted: false, status: "ACTIVE" },
    take: 4,
    select: cardSelect,
  });
  const base = toToman(product.basePrice);
  const sale = product.salePrice ? toToman(product.salePrice) : null;
  return {
    ...product,
    price: effectivePrice(base, sale),
    basePriceToman: base,
    discount: discountPercent(base, effectivePrice(base, sale)),
    related: related.map(toCard),
  };
}

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    select: {
      id: true, name: true, slug: true, description: true, image: true, icon: true,
      _count: { select: { products: { where: { isDeleted: false, status: "ACTIVE" } } } },
    },
  });
}

export async function getCategoryBySlug(slug: string) {
  const category = await prisma.category.findFirst({ where: { slug, isActive: true } });
  if (!category) throw Errors.notFound("دستهبندی یافت نشد");
  return category;
}

export async function getSizeGuides() {
  return prisma.sizeGuide.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, content: true, categoryId: true, productId: true },
  });
}

export async function getHomeData() {
  const [featured, arrivals, bestSellers, categories] = await Promise.all([
    prisma.product.findMany({ where: { isFeatured: true, isDeleted: false, status: "ACTIVE" }, take: 8, select: cardSelect }),
    prisma.product.findMany({ where: { isNewArrival: true, isDeleted: false, status: "ACTIVE" }, take: 8, orderBy: { createdAt: "desc" }, select: cardSelect }),
    prisma.product.findMany({ where: { isDeleted: false, status: "ACTIVE" }, take: 8, orderBy: { orderItems: { _count: "desc" } }, select: cardSelect }),
    getCategories(),
  ]);
  return {
    featured: featured.map(toCard),
    arrivals: arrivals.map(toCard),
    bestSellers: bestSellers.map(toCard),
    categories,
  };
}

// ---------- Admin mutations ----------

export async function createProduct(input: ProductInput) {
  return prisma.product.create({
    data: {
      ...input,
      searchText: await searchTextFor(input),
      salePrice: input.salePrice ?? null,
      brandId: input.brandId ?? null,
      description: input.description ?? null,
      shortDescription: input.shortDescription ?? null,
      material: input.material ?? null,
      fabricComposition: input.fabricComposition ?? null,
      careInstructions: input.careInstructions ?? null,
      heroImage: input.heroImage ?? null,
      metaTitle: input.metaTitle ?? null,
      metaDescription: input.metaDescription ?? null,
    },
  });
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw Errors.notFound("محصول یافت نشد");
  const merged = { ...existing, ...input };
  return prisma.product.update({
    where: { id },
    data: {
      ...input,
      searchText: await searchTextFor({
        name: merged.name, sku: merged.sku, description: merged.description ?? undefined, categoryId: merged.categoryId,
      }),
    },
  });
}

export async function deleteProduct(id: string) {
  const result = await prisma.product.updateMany({
    where: { id, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date(), status: "DISCONTINUED" },
  });
  if (!result.count) throw Errors.notFound("محصول یافت نشد");
}

export async function upsertVariant(productId: string, input: VariantInput, variantId?: string) {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
  if (!product) throw Errors.notFound("محصول یافت نشد");
  const data = {
    size: input.size,
    color: input.color ?? null,
    sku: input.sku,
    price: input.price ?? null,
    stock: input.stock,
    lowStockThreshold: input.lowStockThreshold,
    isAvailable: input.isAvailable,
  };
  if (variantId) {
    return prisma.productVariant.update({ where: { id: variantId, productId }, data });
  }
  return prisma.productVariant.create({ data: { ...data, productId } });
}

export async function deleteVariant(productId: string, variantId: string) {
  const count = await prisma.cartItem.count({ where: { variantId } });
  const orders = await prisma.orderItem.count({ where: { variantId } });
  if (count || orders) throw Errors.conflict("این تنوع در سفارشها یا سبدها استفاده شده است");
  await prisma.productVariant.deleteMany({ where: { id: variantId, productId } });
}

export async function addProductImage(productId: string, url: string, altText?: string, color?: string, variantId?: string) {
  const count = await prisma.productImage.count({ where: { productId } });
  return prisma.productImage.create({
    data: { productId, url, altText, color: color ?? null, variantId: variantId ?? null, isPrimary: count === 0, displayOrder: count },
  });
}

export async function setPrimaryImage(productId: string, imageId: string) {
  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
    prisma.productImage.updateMany({ where: { id: imageId, productId }, data: { isPrimary: true } }),
  ]);
}

export async function deleteProductImage(productId: string, imageId: string) {
  const image = await prisma.productImage.findFirst({ where: { id: imageId, productId } });
  if (!image) throw Errors.notFound("تصویر یافت نشد");
  await prisma.productImage.delete({ where: { id: image.id } });
  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({ where: { productId }, orderBy: { displayOrder: "asc" } });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
}

export async function adjustStock(input: {
  variantId: string; quantity: number; reason: "RESTOCK" | "ADJUSTMENT" | "RETURN"; note?: string; userId?: string;
}) {
  if (input.quantity === 0) throw Errors.badRequest("مقدار تغییر موجودی نمیتواند صفر باشد");
  await prisma.$transaction(async (tx) => {
    const variant = await tx.productVariant.findUnique({
      where: { id: input.variantId },
      select: { stock: true, productId: true },
    });
    if (!variant) throw Errors.notFound("تنوع یافت نشد");
    const next = variant.stock + input.quantity;
    if (next < 0) throw Errors.conflict("موجودی نمیتواند منفی شود");
    await tx.productVariant.update({ where: { id: input.variantId }, data: { stock: next } });
    await tx.inventoryMovement.create({
      data: {
        variantId: input.variantId, quantity: input.quantity, reason: input.reason,
        note: input.note ?? null, userId: input.userId ?? null,
      },
    });
    await recalcProductStock(tx, variant.productId);
  });
}

export async function recalcProductStock(
  tx: Prisma.TransactionClient,
  productId: string,
) {
  const aggregate = await tx.productVariant.aggregate({
    where: { productId },
    _sum: { stock: true },
  });
  const total = aggregate._sum.stock ?? 0;
  await tx.product.update({
    where: { id: productId },
    data: { totalStock: total, availableStock: total },
  });
}

export async function lowStockVariants() {
  return prisma.productVariant.findMany({
    where: { stock: { lte: 5 }, isAvailable: true, product: { isDeleted: false } },
    include: { product: { select: { id: true, name: true, slug: true, isDeleted: true } } },
    orderBy: { stock: "asc" },
    take: 50,
  });
}

export async function createCategory(input: CategoryInput) {
  return prisma.category.create({ data: { ...input, description: input.description ?? null, image: input.image ?? null, icon: input.icon ?? null, parentId: input.parentId ?? null } });
}

export async function updateCategory(id: string, input: Partial<CategoryInput>) {
  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteCategory(id: string) {
  const [children, products] = await Promise.all([
    prisma.category.count({ where: { parentId: id } }),
    prisma.product.count({ where: { categoryId: id, isDeleted: false } }),
  ]);
  if (children || products) throw Errors.conflict("دستهبندی دارای محصول یا زیردسته است");
  await prisma.category.delete({ where: { id } });
}
