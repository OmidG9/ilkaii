import { NextRequest } from "next/server";
import { adminService } from "@/services";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const role = req.headers.get("x-user-role");
  return role === "ADMIN";
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const categories = await adminService.getAllCategories();
    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const body = await req.json();
    const { name, slug, description, icon, parentId } = body;

    if (!name || !slug) {
      throw new ApiError(400, "Name and slug are required");
    }

    const category = await adminService.createCategory({
      name,
      slug,
      description,
      icon,
      parentId,
    });

    return successResponse(category, "Category created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
