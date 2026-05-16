import { NextRequest } from "next/server";
import { usersRepo } from "@/lib/repositories";
import { updateUserSchema } from "@/lib/validators";
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
    const user = await usersRepo.getById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return successResponse({
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    const body = await req.json();
    const data = updateUserSchema.parse(body);

    const user = await usersRepo.update(userId, data);

    return successResponse({
      id: user.id,
      phone: user.phone,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
