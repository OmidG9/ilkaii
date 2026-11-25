import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const base = () => (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");

const staticPages: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/shop", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/size-guide", priority: 0.5, changeFrequency: "monthly" },
  { path: "/policies/shipping", priority: 0.4, changeFrequency: "monthly" },
  { path: "/policies/returns", priority: 0.4, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

/** Fails soft when the database is unavailable during a build or health check. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categories: Array<{ slug: string; updatedAt: Date }> = [];
  let products: Array<{ slug: string; updatedAt: Date }> = [];
  try {
    [categories, products] = await Promise.all([
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
  ];
}
