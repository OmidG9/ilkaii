import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
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

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status");

    let where: any = {};
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * pageSize;

    // Note: In production, use proper pagination with Prisma
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        items: { include: { product: true } },
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.order.count({ where });
    const totalPages = Math.ceil(total / pageSize);

    return successResponse({
      data: orders,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
