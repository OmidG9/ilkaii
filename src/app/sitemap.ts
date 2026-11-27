import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { collections } from "@/config/editorial";

export const dynamic = "force-dynamic";

const base = () => (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const staticPages: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/new-arrivals", priority: 0.9, changeFrequency: "daily" },
  { path: "/sale", priority: 0.8, changeFrequency: "daily" },
  { path: "/collections", priority: 0.8, changeFrequency: "weekly" },
  { path: "/lookbook", priority: 0.7, changeFrequency: "weekly" },
  { path: "/brands", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/sustainability", priority: 0.5, changeFrequency: "monthly" },
  { path: "/stores", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/size-guide", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/policies/shipping", priority: 0.4, changeFrequency: "monthly" },
  { path: "/policies/returns", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" },
];

/** Fails soft when the database is unavailable during a build or health check. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categories: Array<{ slug: string; updatedAt: Date }> = [];
  let products: Array<{ slug: string; updatedAt: Date }> = [];
  let pages: Array<{ slug: string; updatedAt: Date }> = [];
  let posts: Array<{ slug: string; updatedAt: Date }> = [];
  let brands: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    const now = new Date();
    [categories, products, pages, posts, brands] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.product.findMany({
        where: { isDeleted: false, status: "ACTIVE" },
        select: { slug: true, updatedAt: true },
        orderBy: { createdAt: "desc" },
        take: 5000,
      }),
      prisma.cmsPage.findMany({
        where: { OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }] },
        select: { slug: true, updatedAt: true },
      }),
      prisma.blogPost.findMany({
        where: { OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }] },
        select: { slug: true, updatedAt: true },
      }),
      prisma.brand.findMany({
        where: { isActive: true, products: { some: { isDeleted: false, status: "ACTIVE" } } },
        select: { slug: true, updatedAt: true },
      }),
    ]);
  } catch {
    // Static routes are still useful without a database connection.
  }

  return [
    ...staticPages.map((page) => ({
      url: `${base()}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...categories.map((category) => ({
      url: `${base()}/category/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${base()}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...pages.map((page) => ({
      url: `${base()}/pages/${page.slug}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.4,
    })),
    ...posts.map((post) => ({
      url: `${base()}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...brands.map((brand) => ({
      url: `${base()}/brands/${brand.slug}`,
      lastModified: brand.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...collections.map((collection) => ({
      url: `${base()}/collections/${collection.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
