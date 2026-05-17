import { NextRequest } from "next/server";
import { cartService } from "@/services";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { auth } from "@/auth";

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

    const summary = await cartService.getCartSummary(session.user.id);
    return successResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
