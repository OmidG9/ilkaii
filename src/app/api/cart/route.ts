import { NextRequest } from "next/server";
import { cartService } from "@/services";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";

async function getUserId(req: NextRequest): Promise<string> {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    throw new ApiError(401, "Unauthorized - No user ID");
  }
  return userId;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const summary = await cartService.getCartSummary(userId);
    return successResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
