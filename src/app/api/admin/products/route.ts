import { NextRequest } from "next/server";
import { productsRepo } from "@/lib/repositories";
import { createProductSchema, productQuerySchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { generateSlug } from "@/lib/utils";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const role = req.headers.get("x-user-role");
  return role === "ADMIN";
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const searchParams = req.nextUrl.searchParams;

    const filters = productQuerySchema.parse({
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
      search: searchParams.get("search"),
      status: searchParams.get("status"),
    });

    const result = await productsRepo.getAll(filters.page, filters.pageSize, {
      search: filters.search,
      status: filters.status,
    });

    return successResponse(result);
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
    const data = createProductSchema.parse(body);

    // Ensure unique slug
    let slug = data.slug;
    let existingProduct = await productsRepo.getBySku(data.sku);

    if (existingProduct) {
      throw new ApiError(400, "SKU already exists");
    }

    const product = await productsRepo.create({
      ...data,
      slug: slug || generateSlug(data.name),
      availableStock: data.totalStock,
    });

    return successResponse(product, "Product created successfully", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
