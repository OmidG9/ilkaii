import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { updateUserSchema } from "@/lib/validators";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized - Please login first");
    }

    const body = await req.json();
    const data = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        phone: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    return successResponse(user, "Profile updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}
