import { NextRequest } from "next/server";
import { productsService } from "@/services";
import { productQuerySchema } from "@/lib/validators";
import {
  successResponse,
  handleApiError,
  paginatedResponse,
} from "@/lib/utils";
import { ZodError } from "zod";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const filters = productQuerySchema.parse({
      page: searchParams.get("page") || "1",
      pageSize: searchParams.get("pageSize") || "20",
      search: searchParams.get("search"),
      categoryId: searchParams.get("categoryId"),
      categorySlug: searchParams.get("categorySlug"),
      sortBy: searchParams.get("sortBy"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      status: searchParams.get("status"),
    });

    const result = await productsService.getProducts(filters);

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
