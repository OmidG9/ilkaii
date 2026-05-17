import { NextRequest } from "next/server";
import { adminService } from "@/services";
import { successResponse, handleApiError, ApiError } from "@/lib/utils";
import prisma from "@/lib/prisma";

async function isAdmin(req: NextRequest): Promise<boolean> {
  const role = req.headers.get("x-user-role");
  return role === "ADMIN";
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin(req))) {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const reportType = req.nextUrl.searchParams.get("type") || "inventory";

    if (reportType === "inventory") {
      const report = await adminService.getInventoryReport();
      return successResponse(report);
    }

    if (reportType === "sales") {
      // Get sales data for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          paymentStatus: "COMPLETED",
        },
        select: { totalAmount: true, createdAt: true },
      });

      const totalSales = orders.reduce(
        (sum, o) => sum + Number(o.totalAmount),
        0,
      );
      const orderCount = orders.length;

      return successResponse({
        totalSales,
        orderCount,
        averageOrderValue: orderCount > 0 ? totalSales / orderCount : 0,
        period: "30 days",
      });
    }

    if (reportType === "users") {
      const totalUsers = await prisma.user.count();
      const verifiedUsers = await prisma.user.count({
        where: { isVerified: true },
      });
      const customersWithOrders = await prisma.user.count({
        where: {
          orders: {
            some: {},
          },
        },
      });

      return successResponse({
        total: totalUsers,
        verified: verifiedUsers,
        customersWithOrders,
      });
    }

    throw new ApiError(400, "Invalid report type");
  } catch (error) {
    return handleApiError(error);
  }
}
