import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: { images: { take: 1 } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(items);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

    const { productId } = await req.json();

    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (existing) {
      throw new ApiError(400, "Item already in wishlist");
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId: session.user.id,
        productId,
      },
      include: { product: true },
    });

    return successResponse(item, "Item added to wishlist", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

    const { searchParams } = req.nextUrl;
    const productId = searchParams.get("productId");

    if (!productId) {
      throw new ApiError(400, "Product ID is required");
    }

    const item = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    if (!item) {
      throw new ApiError(404, "Item not in wishlist");
    }

    await prisma.wishlistItem.delete({
      where: { id: item.id },
    });

    return successResponse(null, "Item removed from wishlist");
  } catch (error) {
    return handleApiError(error);
  }
}
