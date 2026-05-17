import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { auth } from "@/auth";

async function checkAdminAccess() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized - Please login first");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError(403, "Forbidden - Admin access required");
  }

  return user;
}

export async function POST(req: NextRequest) {
  try {
    await checkAdminAccess();

    const body = await req.json();
    const { productId, size, color, sku, price, stock } = body;

    if (!productId || !size || !sku) {
      throw new ApiError(400, "Product ID, size, and SKU are required");
    }

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Check SKU uniqueness
    const existing = await prisma.productVariant.findUnique({
      where: { sku },
    });

    if (existing) {
      throw new ApiError(400, "SKU already exists");
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        size,
        color,
        sku,
        price,
        stock: stock || 0,
      },
    });

    return successResponse(variant, "Variant created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const productId = searchParams.get("productId");

    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: "asc" },
    });

    return successResponse(variants);
  } catch (error) {
    return handleApiError(error);
  }
}
