import { NextRequest } from "next/server";
import { ordersRepo } from "@/lib/repositories";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

async function getUserId(req: NextRequest): Promise<string> {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const orders = await ordersRepo.getByUserId(userId, page, pageSize);
    return successResponse(orders);
  } catch (error) {
    return handleApiError(error);
  }
}
