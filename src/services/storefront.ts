import { prisma } from "@/lib/db";
import {
  collections,
  lookbookChapters,
  type EditorialCollection,
  type LookbookChapter,
} from "@/config/editorial";
import {
  getCategories,
  listBrandProducts,
  listProducts,
  type ProductCard,
} from "@/services/catalog";

/** Public brands that actually have at least one active product. */
export async function getPublicBrands() {
  return prisma.brand.findMany({
    where: {
      isActive: true,
      products: { some: { isDeleted: false, status: "ACTIVE" } },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      _count: {
        select: { products: { where: { isDeleted: false, status: "ACTIVE" } } },
      },
    },
  });
}

export async function getPublicBrandBySlug(slug: string) {
  const brand = await prisma.brand.findFirst({
    where: { slug, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      _count: {
        select: { products: { where: { isDeleted: false, status: "ACTIVE" } } },
      },
    },
  });
  if (!brand) return null;
  const products = await listBrandProducts(brand.id, 24);
  return { brand, products };
}

export interface CollectionShowcase {
  collection: EditorialCollection;
  category: { id: string; name: string; slug: string; description: string | null; _count: { products: number } } | null;
}

export async function getCollectionsShowcase(): Promise<CollectionShowcase[]> {
  const categories = await getCategories();
  return collections.map((collection) => ({
    collection,
    category: categories.find((category) => category.slug === collection.categorySlug) ?? null,
  }));
}

export async function getCollectionPage(slug: string) {
  const collection = collections.find((item) => item.slug === slug);
  if (!collection) return null;

  const category = await prisma.category.findFirst({
    where: { slug: collection.categorySlug, isActive: true },
    select: { id: true, name: true, slug: true, description: true },
  });

  let products: ProductCard[] = [];
  let total = 0;
  if (category) {
    const result = await listProducts({
      page: 1,
      pageSize: 12,
      category: category.slug,
      sort: "newest",
    });
    products = result.items;
    total = result.total;
  }

  return { collection, category, products, total };
}

export interface LookbookSpread {
  chapter: LookbookChapter;
  category: { name: string; slug: string } | null;
  products: ProductCard[];
}

export async function getLookbookSpreads(): Promise<LookbookSpread[]> {
  return Promise.all(
    lookbookChapters.map(async (chapter) => {
      const category = await prisma.category.findFirst({
        where: { slug: chapter.categorySlug, isActive: true },
        select: { name: true, slug: true },
      });
      if (!category) return { chapter, category: null, products: [] };
      const result = await listProducts({
        page: 1,
        pageSize: 4,
        category: category.slug,
        sort: "newest",
      });
      return { chapter, category, products: result.items };
    }),
  );
}

export async function getNewArrivals(limit = 12) {
  const [result, categories] = await Promise.all([
    listProducts({ page: 1, pageSize: limit, sort: "newest", newArrival: "true" }),
    getCategories(),
  ]);
  return {
    products: result.items,
    total: result.total,
    categories: categories.filter((category) => category._count.products > 0),
  };
}

/** A small, stable set of products used for editorial "shop the story" blocks. */
export async function getEditorialPicks(limit = 4): Promise<ProductCard[]> {
  const featured = await listProducts({ page: 1, pageSize: limit, sort: "newest", featured: "true" });
  if (featured.items.length >= limit) return featured.items;
  const arrivals = await listProducts({ page: 1, pageSize: limit, sort: "newest", newArrival: "true" });
  const seen = new Set(featured.items.map((product) => product.id));
  return [...featured.items, ...arrivals.items.filter((product) => !seen.has(product.id))].slice(0, limit);
}
