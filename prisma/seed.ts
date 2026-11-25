/**
 * Development seed. Safe to run repeatedly. Creates no administrator accounts
 * and no credentials — use `npm run admin:grant` for explicit bootstrap.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ensureRolesAndPermissions } from "../src/lib/auth/bootstrap";
import { normalizeForSearch } from "../src/lib/persian";

const prisma = new PrismaClient();

const categories = [
  { name: "هودی و سویشرت", slug: "hoodies" },
  { name: "پوشاک ورزشی", slug: "sportswear" },
  { name: "پیراهن", slug: "dresses" },
  { name: "لباس بیرونی", slug: "outerwear" },
  { name: "شلوار", slug: "pants" },
];

const products = [
  { slug: "oversized-hoodie", name: "هودی اورسایز زنانه", price: 890000, sale: 740000, category: "hoodies", colors: ["مشکی", "کرم"], sizes: ["S", "M", "L", "XL"] },
  { slug: "high-waist-legging", name: "لگینگ ورزشی کمر بلند", price: 590000, sale: null, category: "sportswear", colors: ["مشکی", "خاکستری"], sizes: ["S", "M", "L"] },
  { slug: "floral-maxi-dress", name: "پیراهن ماکسی گلدار", price: 1290000, sale: 990000, category: "dresses", colors: ["سرمهای", "سبز"], sizes: ["S", "M", "L"] },
  { slug: "light-autumn-jacket", name: "کاپشن سبک پاییزی", price: 2190000, sale: null, category: "outerwear", colors: ["بژ", "مشکی"], sizes: ["M", "L", "XL"] },
  { slug: "sports-crop-top", name: "تاپ ورزشی تاپیس", price: 420000, sale: 350000, category: "sportswear", colors: ["صورتی", "مشکی"], sizes: ["S", "M"] },
  { slug: "relaxed-jeans", name: "شلوار جین آزاد", price: 980000, sale: null, category: "pants", colors: ["آبی", "مشکی"], sizes: ["36", "38", "40"] },
];

async function placeholderImage(slug: string, color: string, index: number) {
  const dir = path.join(process.cwd(), "public", "images", "seed");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${slug}-${index}.webp`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500"><rect width="1200" height="1500" fill="${color}"/><text x="600" y="760" font-size="72" font-family="sans-serif" text-anchor="middle" fill="#ffffff" opacity="0.75">ilkaii</text></svg>`;
  await writeFile(file, await sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer(), { flag: "wx" }).catch(() => undefined);
  return `/images/seed/${path.basename(file)}`;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed is disabled in production. Use migrations and the admin dashboard.");
  }
  await ensureRolesAndPermissions();

  for (const [index, category] of categories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, displayOrder: index },
      create: {
        name: category.name,
        slug: category.slug,
        description: `مجموعه ${category.name}`,
        displayOrder: index,
      },
    });
  }
  const storedCategories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryBySlug = new Map(storedCategories.map((c) => [c.slug, c.id]));

  for (const [index, item] of products.entries()) {
    const categoryId = categoryBySlug.get(item.category);
    if (!categoryId) continue;
    if (await prisma.product.findUnique({ where: { slug: item.slug }, select: { id: true } })) continue;

    const image = await placeholderImage(item.slug, index % 2 ? "#6B5E57" : "#A89C94", 1);
    const second = await placeholderImage(item.slug, "#2B2B2B", 2);
    const created = await prisma.product.create({
      data: {
        name: item.name,
        slug: item.slug,
        sku: `ILK-${String(index + 1).padStart(4, "0")}`,
        searchText: normalizeForSearch([item.name, ...item.colors].join(" ")),
        description: `${item.name} — طراحی شده برای راحتی و استایل روزمره. کیفیت برتر با دوام بالا.`,
        shortDescription: "کیفیت برتر، طراحی مینیمال",
        categoryId,
        basePrice: item.price,
        salePrice: item.sale,
        currency: "TOMAN",
        status: "ACTIVE",
        isFeatured: index < 3,
        isNewArrival: index % 2 === 0,
        gender: "WOMEN",
        season: "ALL_SEASON",
        material: "پنبه و پلیاستر",
        fabricComposition: "۸۰٪ پنبه، ۲۰٪ پلیاستر",
        careInstructions: "شستشو با آب سرد، ماشین خشک‌کن ممنوع",
        heroImage: image,
        metaTitle: item.name,
        metaDescription: item.name,
        images: {
          create: [
            { url: image, altText: item.name, isPrimary: true, displayOrder: 0 },
            { url: second, altText: `${item.name} نمای دوم`, displayOrder: 1 },
          ],
        },
        variants: {
          create: item.colors.flatMap((color, ci) =>
            item.sizes.map((size) => ({
              size,
              color,
              sku: `ILK-${String(index + 1).padStart(4, "0")}-${ci}-${size}`,
              stock: (index + ci) % 3 === 0 ? 0 : 5 + ((index + size.length) % 8),
              isAvailable: true,
              lowStockThreshold: 5,
            })),
          ),
        },
      },
      select: { id: true },
    });

    const aggregate = await prisma.productVariant.aggregate({
      where: { productId: created.id },
      _sum: { stock: true },
    });
    await prisma.product.update({
      where: { id: created.id },
      data: { totalStock: aggregate._sum.stock ?? 0, availableStock: aggregate._sum.stock ?? 0 },
    });
  }

  await prisma.siteSetting.upsert({
    where: { key: "site.name" },
    update: {},
    create: { key: "site.name", value: "ilkaii" },
  });
  console.log("Seed complete: roles, categories, demo products and settings created.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
