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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAdminAccess();

    const { id } = await params;
    const body = await req.json();
    const { size, color, sku, price, stock } = body;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new ApiError(404, "Variant not found");
    }

    // Check SKU uniqueness if changed
    if (sku && sku !== variant.sku) {
      const existing = await prisma.productVariant.findUnique({
        where: { sku },
      });
      if (existing) {
        throw new ApiError(400, "SKU already exists");
      }
    }

    const updated = await prisma.productVariant.update({
      where: { id },
      data: {
        size: size || variant.size,
        color: color || variant.color,
        sku: sku || variant.sku,
        price: price !== undefined ? price : variant.price,
        stock: stock !== undefined ? stock : variant.stock,
      },
    });

    return successResponse(updated, "Variant updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAdminAccess();

    const { id } = await params;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
    });

    if (!variant) {
      throw new ApiError(404, "Variant not found");
    }

    await prisma.productVariant.delete({
      where: { id },
    });

    return successResponse(null, "Variant deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
