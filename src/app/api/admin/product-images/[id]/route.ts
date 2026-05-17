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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAdminAccess();

    const { id } = await params;

    const image = await prisma.productImage.findUnique({
      where: { id },
    });

    if (!image) {
      throw new ApiError(404, "Image not found");
    }

    await prisma.productImage.delete({
      where: { id },
    });

    return successResponse(null, "Image deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAdminAccess();

    const { id } = await params;
    const body = await req.json();
    const { displayOrder, isPrimary, altText } = body;

    const image = await prisma.productImage.findUnique({
      where: { id },
    });

    if (!image) {
      throw new ApiError(404, "Image not found");
    }

    // If marking as primary, unmark others for same product
    if (isPrimary && !image.isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId: image.productId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const updated = await prisma.productImage.update({
      where: { id },
      data: {
        displayOrder:
          displayOrder !== undefined ? displayOrder : image.displayOrder,
        isPrimary: isPrimary !== undefined ? isPrimary : image.isPrimary,
        altText: altText || image.altText,
      },
    });

    return successResponse(updated, "Image updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
