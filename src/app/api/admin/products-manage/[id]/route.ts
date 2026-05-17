import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { updateProductSchema } from "@/lib/validators";
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAdminAccess();

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { displayOrder: "asc" } },
        variants: true,
        _count: { select: { reviews: true } },
      },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return successResponse(product);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAdminAccess();

    const { id } = await params;
    const body = await req.json();
    const data = updateProductSchema.parse(body);

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== product.slug) {
      const existing = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new ApiError(400, "Slug already exists");
      }
    }

    // Check SKU uniqueness if changed
    if (data.sku && data.sku !== product.sku) {
      const existing = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existing) {
        throw new ApiError(400, "SKU already exists");
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    return successResponse(updated, "Product updated successfully");
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

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    return successResponse(null, "Product deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
