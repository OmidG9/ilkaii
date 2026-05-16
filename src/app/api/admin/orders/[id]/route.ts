import { NextRequest } from "next/server";
import { ordersRepo } from "@/lib/repositories";
import { orderStatusUpdateSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const role = req.headers.get("x-user-role");
  return role === "ADMIN";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const { id } = await params;
    const order = await ordersRepo.getById(id);
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
    if (!(await isAdmin(req))) {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const { id } = await params;
    const body = await req.json();
    const data = orderStatusUpdateSchema.parse(body);

    const order = await ordersRepo.getById(id);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const updated = await ordersRepo.update(id, {
      status: data.status,
      notes: data.notes,
      trackingNumber: data.trackingNumber,
    });

    return successResponse(updated, "Order updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
