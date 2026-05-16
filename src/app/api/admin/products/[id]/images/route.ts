import { NextRequest } from "next/server";
import { productsService } from "@/services";
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

    if (!Array.isArray(body.images)) {
      throw new ApiError(400, "Images must be an array");
    }

    const images = await productsService.addProductImages(id, body.images);

    return successResponse(images, "Images added successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
