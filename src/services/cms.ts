import { z } from "zod";
import { prisma } from "@/lib/db";
import { Errors } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { unlink } from "node:fs/promises";
import path from "node:path";

const href = z.string().max(1024).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "آدرس نامعتبر است");
const optionalHref = href.optional();
const image = z.string().max(1024).refine((value) => value.startsWith("/") || /^https?:\/\//i.test(value), "آدرس تصویر نامعتبر است").optional();

const sectionConfigSchemas = {
  HERO: z.object({
    eyebrow: z.string().max(120).optional(),
    heading: z.string().min(2).max(200),
    subheading: z.string().max(400).optional(),
    image: image,
    mobileImage: image,
    ctaLabel: z.string().max(60).optional(),
    ctaHref: optionalHref,
    secondaryLabel: z.string().max(60).optional(),
    secondaryHref: optionalHref,
    align: z.enum(["start", "center"]).default("start"),
  }),
  BANNER: z.object({
    image: z.string().min(1).max(1024),
    alt: z.string().max(200).optional(),
    href: optionalHref,
    ctaLabel: z.string().max(60).optional(),
  }),
  FEATURED_CATEGORIES: z.object({
    categoryIds: z.array(z.string().max(64)).max(12).default([]),
    limit: z.number().int().min(1).max(12).default(5),
    ctaLabel: z.string().max(60).optional(),
    ctaHref: optionalHref,
  }),
  FEATURED_PRODUCTS: z.object({
    productIds: z.array(z.string().max(64)).max(16).default([]),
    limit: z.number().int().min(1).max(12).default(4),
    ctaLabel: z.string().max(60).optional(),
    ctaHref: optionalHref,
  }),
  NEW_ARRIVALS: z.object({ limit: z.number().int().min(1).max(12).default(4), ctaLabel: z.string().max(60).optional(), ctaHref: optionalHref }),
  BEST_SELLERS: z.object({ limit: z.number().int().min(1).max(12).default(4), ctaLabel: z.string().max(60).optional(), ctaHref: optionalHref }),
  PROMOTIONAL: z.object({
    heading: z.string().min(2).max(200),
    text: z.string().max(1500).optional(),
    image: image,
    ctaLabel: z.string().max(60).optional(),
    ctaHref: optionalHref,
    tone: z.enum(["primary", "secondary", "dark"]).default("primary"),
  }),
  SEASONAL_COLLECTION: z.object({
    heading: z.string().min(2).max(200),
    text: z.string().max(1500).optional(),
    image: image,
    ctaLabel: z.string().max(60).optional(),
    ctaHref: optionalHref,
    collectionSlug: z.string().max(80).optional(),
  }),
  TESTIMONIALS: z.object({
    items: z.array(z.object({
      name: z.string().min(1).max(120),
      text: z.string().min(2).max(1000),
      rating: z.number().int().min(1).max(5).optional(),
      image: image,
    })).min(1).max(12),
  }),
  CUSTOM_CONTENT: z.object({
    heading: z.string().min(2).max(200),
    body: z.string().max(5000),
    image: image,
    ctaLabel: z.string().max(60).optional(),
    ctaHref: optionalHref,
  }),
} as const;

export type HomepageSectionTypeKey = keyof typeof sectionConfigSchemas;

export function parseSectionConfig(type: HomepageSectionTypeKey, config: unknown) {
  const schema = sectionConfigSchemas[type];
  const parsed = schema.safeParse(config ?? {});
  if (!parsed.success) {
    throw Errors.badRequest("تنظیمات بخش صفحه اصلی معتبر نیست", { fields: parsed.error.flatten().fieldErrors });
  }
  return parsed.data;
}

export function sectionConfigTemplate(type: HomepageSectionTypeKey) {
  const samples: Record<HomepageSectionTypeKey, unknown> = {
    HERO: { heading: "استایلی که متعلق به شماست", subheading: "مجموعه جدید فصل", ctaLabel: "مشاهده مجموعه", ctaHref: "/shop", align: "start" },
    BANNER: { image: "/images/placeholder-wide.webp", href: "/shop", ctaLabel: "مشاهده" },
    FEATURED_CATEGORIES: { limit: 5, ctaLabel: "همه دسته‌بندی‌ها", ctaHref: "/shop" },
    FEATURED_PRODUCTS: { limit: 4, ctaLabel: "همه محصولات", ctaHref: "/shop" },
    NEW_ARRIVALS: { limit: 4, ctaLabel: "مشاهده جدیدها", ctaHref: "/shop?newArrival=true" },
    BEST_SELLERS: { limit: 4, ctaLabel: "پرفروش‌ها", ctaHref: "/shop?sort=popular" },
    PROMOTIONAL: { heading: "مجموعه تازه", text: "توضیح کوتاه کمپین", ctaLabel: "خرید", ctaHref: "/shop", tone: "primary" },
    SEASONAL_COLLECTION: { heading: "کلکسیون فصل", text: "توضیح کوتاه", ctaLabel: "مشاهده", ctaHref: "/shop" },
    TESTIMONIALS: { items: [{ name: "مشتری", text: "تجربه خرید عالی", rating: 5 }] },
    CUSTOM_CONTENT: { heading: "درباره مجموعه", body: "متن دلخواه مدیر", ctaLabel: "بیشتر", ctaHref: "/about" },
  };
  return samples[type];
}

// ---------------------------------------------------------------------------
// Public reads used by the storefront
// ---------------------------------------------------------------------------

export async function getActiveHomepageSections() {
  const now = new Date();
  const rows = await prisma.homepageSection.findMany({
    where: {
      isEnabled: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { displayOrder: "asc" },
  });
  return rows.flatMap((row) => {
    try {
      return [{ ...row, parsedConfig: parseSectionConfig(row.type as HomepageSectionTypeKey, row.config) }];
    } catch {
      return [];
    }
  });
}

export async function getActiveMenu(location: "HEADER" | "FOOTER" | "MOBILE") {
  const menu = await prisma.menu.findUnique({
    where: { location },
    include: { items: { where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } },
  });
  if (!menu) return [];
  const byParent = new Map<string | null, typeof menu.items>();
  for (const item of menu.items) {
    const key = item.parentId;
    byParent.set(key, [...(byParent.get(key) ?? []), item]);
  }
  interface MenuNode { id: string; label: string; href: string; target: string; children: MenuNode[] }
  const build = (parentId: string | null): MenuNode[] =>
    (byParent.get(parentId) ?? []).map((item) => ({
      id: item.id, label: item.label,
      href: item.href.startsWith("/") || /^https?:\/\//i.test(item.href) ? item.href : "/",
      target: item.target === "_blank" ? "_blank" : "_self",
      children: build(item.id),
    }));
  return build(null);
}

export async function getActiveBanners(placement = "HOME") {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      placement, isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { displayOrder: "asc" },
    take: 10,
  });
}

export async function getPublishedPage(slug: string) {
  const now = new Date();
  return prisma.cmsPage.findFirst({
    where: { slug, OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }] },
  });
}

export async function listPublishedPages() {
  const now = new Date();
  return prisma.cmsPage.findMany({
    where: { OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }] },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, updatedAt: true },
  });
}

export async function getPublishedPost(slug: string) {
  const now = new Date();
  return prisma.blogPost.findFirst({
    where: { slug, OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }] },
  });
}

export async function listPublishedPosts() {
  const now = new Date();
  return prisma.blogPost.findMany({
    where: { OR: [{ status: "PUBLISHED" }, { status: "SCHEDULED", scheduledAt: { lte: now } }] },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, title: true, excerpt: true, coverImage: true, publishedAt: true, readingMinutes: true, tags: true },
  });
}

// ---------------------------------------------------------------------------
// Admin CMS
// ---------------------------------------------------------------------------

export async function listHomepageSections() {
  return prisma.homepageSection.findMany({ orderBy: { displayOrder: "asc" } });
}

export async function createHomepageSection(input: {
  type: HomepageSectionTypeKey; title?: string; subtitle?: string; config: unknown;
  displayOrder?: number; isEnabled?: boolean; startsAt?: Date; endsAt?: Date;
}, actorId: string) {
  const config = parseSectionConfig(input.type, input.config);
  const count = await prisma.homepageSection.count();
  const section = await prisma.homepageSection.create({
    data: {
      type: input.type, title: input.title ?? null, subtitle: input.subtitle ?? null,
      config: config as object, displayOrder: input.displayOrder ?? count, isEnabled: input.isEnabled ?? true,
      startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null,
    },
  });
  await audit({ actorId, action: "homepage.section_created", entity: "HomepageSection", entityId: section.id, after: { type: input.type, config } });
  return section;
}

export async function updateHomepageSection(id: string, input: {
  type?: HomepageSectionTypeKey; title?: string | null; subtitle?: string | null; config?: unknown;
  displayOrder?: number; isEnabled?: boolean; startsAt?: Date | null; endsAt?: Date | null;
}, actorId: string) {
  const before = await prisma.homepageSection.findUnique({ where: { id } });
  if (!before) throw Errors.notFound("بخش صفحه اصلی یافت نشد");
  const type = (input.type ?? before.type) as HomepageSectionTypeKey;
  const config = input.config !== undefined ? parseSectionConfig(type, input.config) : before.config;
  const section = await prisma.homepageSection.update({
    where: { id },
    data: {
      ...(input.type ? { type: input.type } : {}),
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
      ...(input.config !== undefined ? { config: config as object } : {}),
      ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
      ...(input.isEnabled !== undefined ? { isEnabled: input.isEnabled } : {}),
      ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
      ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
    },
  });
  await audit({ actorId, action: "homepage.section_updated", entity: "HomepageSection", entityId: id, before: { type: before.type, config: before.config, isEnabled: before.isEnabled }, after: { type, config, isEnabled: section.isEnabled } });
  return section;
}

export async function deleteHomepageSection(id: string, actorId: string) {
  const section = await prisma.homepageSection.delete({ where: { id } });
  await audit({ actorId, action: "homepage.section_deleted", entity: "HomepageSection", entityId: id, before: { type: section.type } });
}

export async function reorderHomepageSections(ids: string[], actorId: string) {
  await prisma.$transaction(ids.map((id, index) => prisma.homepageSection.update({ where: { id }, data: { displayOrder: index } })));
  await audit({ actorId, action: "homepage.reordered", entity: "HomepageSection", metadata: { ids } });
}

export async function listCmsPages() {
  return prisma.cmsPage.findMany({ orderBy: { updatedAt: "desc" } });
}

function pageStatusData(status: string, scheduledAt?: Date | null) {
  if (status === "SCHEDULED" && !scheduledAt) throw Errors.badRequest("برای انتشار زمان‌بندی‌شده، تاریخ لازم است");
  return {
    publishedAt: status === "PUBLISHED" ? new Date() : null,
    scheduledAt: status === "SCHEDULED" ? scheduledAt ?? null : null,
  };
}

export async function createCmsPage(input: {
  slug: string; title: string; excerpt?: string; content: string; status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduledAt?: Date; metaTitle?: string; metaDescription?: string; ogImage?: string;
}, actorId: string) {
  if (await prisma.cmsPage.findUnique({ where: { slug: input.slug } })) throw Errors.conflict("این اسلاگ قبلاً استفاده شده است");
  const page = await prisma.cmsPage.create({
    data: {
      slug: input.slug, title: input.title, excerpt: input.excerpt ?? null, content: input.content,
      status: input.status, ...pageStatusData(input.status, input.scheduledAt),
      metaTitle: input.metaTitle ?? null, metaDescription: input.metaDescription ?? null,
      ogImage: input.ogImage ?? null, authorId: actorId,
    },
  });
  await audit({ actorId, action: "cms.page_created", entity: "CmsPage", entityId: page.id, after: { slug: page.slug, status: page.status } });
  return page;
}

export async function updateCmsPage(id: string, input: {
  slug?: string; title?: string; excerpt?: string; content?: string; status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduledAt?: Date; metaTitle?: string; metaDescription?: string; ogImage?: string;
}, actorId: string) {
  const before = await prisma.cmsPage.findUnique({ where: { id } });
  if (!before) throw Errors.notFound("صفحه یافت نشد");
  if (input.slug && input.slug !== before.slug && await prisma.cmsPage.findUnique({ where: { slug: input.slug } })) {
    throw Errors.conflict("این اسلاگ قبلاً استفاده شده است");
  }
  const status = input.status ?? before.status;
  const page = await prisma.cmsPage.update({
    where: { id },
    data: {
      ...input,
      ...(input.status ? pageStatusData(status, input.scheduledAt ?? before.scheduledAt) : {}),
    },
  });
  await audit({ actorId, action: "cms.page_updated", entity: "CmsPage", entityId: id, before: { slug: before.slug, status: before.status, title: before.title }, after: { slug: page.slug, status: page.status, title: page.title } });
  return page;
}

export async function deleteCmsPage(id: string, actorId: string) {
  const page = await prisma.cmsPage.delete({ where: { id } });
  await audit({ actorId, action: "cms.page_deleted", entity: "CmsPage", entityId: id, before: { slug: page.slug, status: page.status } });
}

export async function listBanners() {
  return prisma.banner.findMany({ orderBy: [{ placement: "asc" }, { displayOrder: "asc" }] });
}

export async function createBanner(input: Record<string, unknown>, actorId: string) {
  const banner = await prisma.banner.create({ data: input as never });
  await audit({ actorId, action: "cms.banner_created", entity: "Banner", entityId: banner.id, after: input });
  return banner;
}

export async function updateBanner(id: string, input: Record<string, unknown>, actorId: string) {
  const before = await prisma.banner.findUnique({ where: { id } });
  if (!before) throw Errors.notFound("بنر یافت نشد");
  const banner = await prisma.banner.update({ where: { id }, data: input as never });
  await audit({ actorId, action: "cms.banner_updated", entity: "Banner", entityId: id, before, after: banner });
  return banner;
}

export async function deleteBanner(id: string, actorId: string) {
  const banner = await prisma.banner.delete({ where: { id } });
  await audit({ actorId, action: "cms.banner_deleted", entity: "Banner", entityId: id, before: banner });
}

export async function listMenus() {
  return prisma.menu.findMany({
    include: { items: { orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] } },
    orderBy: { location: "asc" },
  });
}

export async function ensureMenu(location: "HEADER" | "FOOTER" | "MOBILE", actorId: string) {
  const existing = await prisma.menu.findUnique({ where: { location } });
  if (existing) return existing;
  const names = { HEADER: "منوی اصلی", FOOTER: "منوی پایین", MOBILE: "منوی موبایل" };
  const menu = await prisma.menu.create({ data: { location, name: names[location] } });
  await audit({ actorId, action: "cms.menu_created", entity: "Menu", entityId: menu.id, after: { location } });
  return menu;
}

export async function createMenuItem(menuId: string, input: {
  label: string; href: string; parentId?: string; target?: "_self" | "_blank"; displayOrder?: number; isActive?: boolean;
}, actorId: string) {
  const parent = input.parentId
    ? await prisma.menuItem.findFirst({ where: { id: input.parentId, menuId }, select: { id: true } })
    : null;
  if (input.parentId && !parent) throw Errors.badRequest("منوی والد نامعتبر است");
  const count = await prisma.menuItem.count({ where: { menuId } });
  const item = await prisma.menuItem.create({
    data: { menuId, label: input.label, href: input.href, parentId: parent?.id ?? null, target: input.target ?? "_self", displayOrder: input.displayOrder ?? count, isActive: input.isActive ?? true },
  });
  await audit({ actorId, action: "cms.menu_item_created", entity: "MenuItem", entityId: item.id, after: input });
  return item;
}

export async function updateMenuItem(id: string, input: {
  label?: string; href?: string; parentId?: string | null; target?: "_self" | "_blank"; displayOrder?: number; isActive?: boolean;
}, actorId: string) {
  const before = await prisma.menuItem.findUnique({ where: { id } });
  if (!before) throw Errors.notFound("آیتم منو یافت نشد");
  if (input.parentId === id) throw Errors.badRequest("منو نمی‌تواند والد خودش باشد");
  if (input.parentId) {
    const parent = await prisma.menuItem.findFirst({ where: { id: input.parentId, menuId: before.menuId } });
    if (!parent) throw Errors.badRequest("منوی والد نامعتبر است");
    // Prevent cycles: the new parent must not be a descendant of this item.
    let cursor: string | null = parent.id;
    const seen = new Set<string>();
    while (cursor) {
      if (cursor === id) throw Errors.badRequest("ساخت حلقه در منو مجاز نیست");
      if (seen.has(cursor)) break;
      seen.add(cursor);
      const row: { parentId: string | null } | null = await prisma.menuItem.findUnique({ where: { id: cursor }, select: { parentId: true } });
      cursor = row?.parentId ?? null;
    }
  }
  const item = await prisma.menuItem.update({ where: { id }, data: input });
  await audit({ actorId, action: "cms.menu_item_updated", entity: "MenuItem", entityId: id, before, after: item });
  return item;
}

export async function deleteMenuItem(id: string, actorId: string) {
  const children = await prisma.menuItem.count({ where: { parentId: id } });
  if (children) throw Errors.conflict("ابتدا زیرمنوها را حذف یا جابجا کنید");
  const item = await prisma.menuItem.delete({ where: { id } });
  await audit({ actorId, action: "cms.menu_item_deleted", entity: "MenuItem", entityId: id, before: item });
}

export async function reorderMenuItems(menuId: string, ids: string[], actorId: string) {
  const owned = await prisma.menuItem.count({ where: { menuId, id: { in: ids } } });
  if (owned !== ids.length) throw Errors.badRequest("آیتم‌های منو معتبر نیستند");
  await prisma.$transaction(ids.map((id, index) => prisma.menuItem.update({ where: { id }, data: { displayOrder: index } })));
  await audit({ actorId, action: "cms.menu_reordered", entity: "Menu", entityId: menuId, metadata: { ids } });
}

export async function listMediaAssets(q?: string, type?: string) {
  return prisma.mediaAsset.findMany({
    where: {
      ...(q ? { OR: [{ url: { contains: q } }, { altText: { contains: q } }] } : {}),
      ...(type ? { mimeType: { startsWith: type } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function createMediaAsset(input: {
  url: string; mimeType: string; size: number; width?: number; height?: number; publicId?: string; uploadedById?: string;
}) {
  return prisma.mediaAsset.upsert({
    where: { url: input.url },
    update: { size: input.size, mimeType: input.mimeType, width: input.width ?? null, height: input.height ?? null },
    create: { ...input, width: input.width ?? null, height: input.height ?? null, publicId: input.publicId ?? null, uploadedById: input.uploadedById ?? null },
  });
}

export async function updateMediaAsset(id: string, input: { altText?: string; folder?: string }, actorId: string) {
  const asset = await prisma.mediaAsset.update({ where: { id }, data: input });
  await audit({ actorId, action: "cms.media_updated", entity: "MediaAsset", entityId: id, after: input });
  return asset;
}

export async function deleteMediaAsset(id: string, actorId: string) {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) throw Errors.notFound("فایل رسانه یافت نشد");
  const [productImages, heroImages, banners, posts, pages] = await Promise.all([
    prisma.productImage.count({ where: { url: asset.url } }),
    prisma.product.count({ where: { heroImage: asset.url } }),
    prisma.banner.count({ where: { OR: [{ image: asset.url }, { mobileImage: asset.url }] } }),
    prisma.blogPost.count({ where: { OR: [{ coverImage: asset.url }] } }),
    prisma.cmsPage.count({ where: { ogImage: asset.url } }),
  ]);
  if (productImages + heroImages + banners + posts + pages > 0) throw Errors.conflict("این فایل در محتوا یا محصولات استفاده شده و قابل حذف نیست");
  await prisma.mediaAsset.delete({ where: { id } });
  if (asset.url.startsWith("/uploads/")) {
    const file = path.join(process.cwd(), "public", "uploads", path.basename(asset.url));
    await unlink(file).catch(() => undefined);
  }
  await audit({ actorId, action: "cms.media_deleted", entity: "MediaAsset", entityId: id, before: { url: asset.url } });
}

export async function storageUsage() {
  const aggregate = await prisma.mediaAsset.aggregate({ _sum: { size: true }, _count: { _all: true } });
  return { bytes: aggregate._sum.size ?? 0, files: aggregate._count._all };
}

export async function listBlogPosts() {
  return prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
}

export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduledAt?: Date;
  tags?: string;
  readingMinutes?: number;
  metaTitle?: string;
  metaDescription?: string;
}

export async function createBlogPost(input: BlogPostInput, actorId: string) {
  if (await prisma.blogPost.findUnique({ where: { slug: input.slug } })) throw Errors.conflict("این اسلاگ قبلاً استفاده شده است");
  const post = await prisma.blogPost.create({
    data: {
      slug: input.slug, title: input.title, excerpt: input.excerpt ?? null, content: input.content,
      coverImage: input.coverImage ?? null, status: input.status,
      ...pageStatusData(input.status, input.scheduledAt),
      tags: input.tags ?? null, readingMinutes: input.readingMinutes ?? 4,
      metaTitle: input.metaTitle ?? null, metaDescription: input.metaDescription ?? null,
      authorId: actorId,
    },
  });
  await audit({ actorId, action: "cms.post_created", entity: "BlogPost", entityId: post.id, after: { slug: post.slug, status: post.status } });
  return post;
}

export async function updateBlogPost(id: string, input: Partial<BlogPostInput>, actorId: string) {
  const before = await prisma.blogPost.findUnique({ where: { id } });
  if (!before) throw Errors.notFound("نوشته یافت نشد");
  if (input.slug && input.slug !== before.slug && await prisma.blogPost.findUnique({ where: { slug: input.slug } })) {
    throw Errors.conflict("این اسلاگ قبلاً استفاده شده است");
  }
  const status = input.status ?? before.status;
  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...input,
      ...(input.status ? pageStatusData(status, input.scheduledAt ?? before.scheduledAt) : {}),
    },
  });
  await audit({ actorId, action: "cms.post_updated", entity: "BlogPost", entityId: id, before: { slug: before.slug, status: before.status }, after: { slug: post.slug, status: post.status } });
  return post;
}

export async function deleteBlogPost(id: string, actorId: string) {
  const post = await prisma.blogPost.delete({ where: { id } });
  await audit({ actorId, action: "cms.post_deleted", entity: "BlogPost", entityId: id, before: { slug: post.slug } });
}

export async function promoteScheduledContent(actorId?: string) {
  const now = new Date();
  const [pages, posts] = await prisma.$transaction([
    prisma.cmsPage.updateMany({ where: { status: "SCHEDULED", scheduledAt: { lte: now } }, data: { status: "PUBLISHED", publishedAt: now } }),
    prisma.blogPost.updateMany({ where: { status: "SCHEDULED", scheduledAt: { lte: now } }, data: { status: "PUBLISHED", publishedAt: now } }),
  ]);
  await audit({ actorId, action: "cms.scheduled_published", entity: "CmsPage", metadata: { pages: pages.count, posts: posts.count } });
  return { pages: pages.count, posts: posts.count };
}
