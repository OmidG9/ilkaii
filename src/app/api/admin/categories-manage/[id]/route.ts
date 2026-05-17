import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { updateCategorySchema } from "@/lib/validators";
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: { children: true, _count: { select: { products: true } } },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    return successResponse(category);
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
    const data = updateCategorySchema.parse(body);

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    // Check slug uniqueness if changed
    if (data.slug && data.slug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new ApiError(400, "Slug already exists");
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    return successResponse(updated, "Category updated successfully");
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

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    // Check if has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      throw new ApiError(400, "Cannot delete category with products");
    }

    await prisma.category.delete({
      where: { id },
    });

    return successResponse(null, "Category deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
