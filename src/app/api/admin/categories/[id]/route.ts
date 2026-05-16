import { NextRequest } from "next/server";
import { adminService } from "@/services";
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

    const category = await adminService.updateCategory(id, body);
    return successResponse(category, "Category updated successfully");
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
    const category = await adminService.deleteCategory(id);
    return successResponse(category, "Category deleted successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
