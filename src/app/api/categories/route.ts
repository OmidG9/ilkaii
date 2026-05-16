import { NextRequest } from "next/server";
import { categoriesRepo } from "@/lib/repositories";
import { successResponse, handleApiError } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const categories = await categoriesRepo.getAll(true);
    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
