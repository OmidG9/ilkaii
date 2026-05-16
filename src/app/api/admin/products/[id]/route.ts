import { NextRequest } from "next/server";
import { productsRepo } from "@/lib/repositories";
import { updateProductSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const role = req.headers.get("x-user-role");
  return role === "ADMIN";
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
    const data = updateProductSchema.parse(body);

    const product = await productsRepo.getById(id);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    // Check if SKU changed and is unique
    if (data.sku && data.sku !== product.sku) {
      const existing = await productsRepo.getBySku(data.sku);
      if (existing) {
        throw new ApiError(400, "SKU already exists");
      }
    }

    const updated = await productsRepo.update(id, data);

    return successResponse(updated, "Product updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const { id } = await params;
    const product = await productsRepo.getById(id);
    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    await productsRepo.delete(id);

    return successResponse(null, "Product deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
