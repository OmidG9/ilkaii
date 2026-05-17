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
    const { productId, url, altText, isPrimary } = body;

    if (!productId || !url) {
      throw new ApiError(400, "Product ID and URL are required");
    }

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // If marking as primary, unmark others
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const image = await prisma.productImage.create({
      data: {
        productId,
        url,
        altText,
        isPrimary: isPrimary || false,
        displayOrder: 0,
      },
    });

    return successResponse(image, "Image added successfully", 201);
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

    const images = await prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: "asc" },
    });

    return successResponse(images);
  } catch (error) {
    return handleApiError(error);
  }
}
