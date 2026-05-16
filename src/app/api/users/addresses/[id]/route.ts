import { NextRequest } from "next/server";
import { addressesRepo } from "@/lib/repositories";
import { updateAddressSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import prisma from "@/lib/prisma";

async function getUserId(req: NextRequest): Promise<string> {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  return userId;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(req);
    const { id } = await params;
    const body = await req.json();
    const data = updateAddressSchema.parse(body);

    // Verify address belongs to user
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== userId) {
      throw new ApiError(404, "Address not found");
    }

    const updated = await addressesRepo.update(id, data);
    return successResponse(updated, "Address updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId(req);
    const { id } = await params;

    // Verify address belongs to user
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== userId) {
      throw new ApiError(404, "Address not found");
    }

    await addressesRepo.delete(id);
    return successResponse(null, "Address deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
