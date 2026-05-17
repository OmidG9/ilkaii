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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await checkAdminAccess();

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, variant: true } },
        user: true,
        deliveryAddress: true,
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return successResponse(order);
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
    const { status, shippingStatus, trackingNumber, notes } = body;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        status,
        shippingStatus,
        trackingNumber,
        notes,
      },
      include: {
        items: { include: { product: true } },
        user: true,
        deliveryAddress: true,
      },
    });

    return successResponse(updated, "Order updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
