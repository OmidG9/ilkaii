import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import { auth } from "@/auth";

async function checkAdminAccess() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new ApiError(401, "Unauthorized - Please login first");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.role !== "ADMIN") {
    throw new ApiError(403, "Forbidden - Admin access required");
  }

  return user;
}

export async function GET(req: NextRequest) {
  try {
    await checkAdminAccess();

    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const skip = (page - 1) * pageSize;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: pageSize,
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
    ]);

    return successResponse({
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
