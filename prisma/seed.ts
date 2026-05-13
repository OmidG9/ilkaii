import { PrismaClient } from "@prisma/client";
import { sampleProducts } from "../src/lib/sampleProducts";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { phone: "+10000000000" },
    update: {
      firstName: "Ilkaii",
      lastName: "Customer",
      email: "hello@ilkaii.com",
      isVerified: true,
    },
    create: {
      phone: "+10000000000",
      email: "hello@ilkaii.com",
      firstName: "Ilkaii",
      lastName: "Customer",
      isVerified: true,
    },
  });

  for (const product of sampleProducts) {
    const category = await prisma.category.upsert({
      where: { name: product.category },
      update: {},
      create: {
        name: product.category,
        slug: product.category.toLowerCase(),
        description: `${product.category} curated for luxury stock shoppers.`,
      },
    });

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        heroImage: product.heroImage,
        stockCondition: product.stockCondition,
        totalStock: 120,
        availableStock: 120,
        status: "ACTIVE",
        categoryId: category.id,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        currency: "USD",
        stockCondition: product.stockCondition,
        sku: `SKU-${product.id}`,
        barcode: `BAR-${product.id}`,
        totalStock: 120,
        availableStock: 120,
        status: "ACTIVE",
        heroImage: product.heroImage,
        category: {
          connect: { id: category.id },
        },
        images: {
          create: product.gallery.map((url, index) => ({
            url,
            altText: `${product.name} image ${index + 1}`,
            displayOrder: index,
          })),
        },
      },
    });
  }

  console.log("Seed completed. Default user id:", user.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
