import { NextRequest } from "next/server";
import { productsService } from "@/services";
import { productVariantSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const role = req.headers.get("x-user-role");
  return role === "ADMIN";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin(req))) {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const { id } = await params;
    const body = await req.json();
    const variant = productVariantSchema.parse(body);

    const created = await productsService.addProductVariant(id, variant);

    return successResponse(created, "Variant added successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
