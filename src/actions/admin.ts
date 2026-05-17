"use server";

import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/utils";
import { auth } from "@/auth";

export async function getAdminDashboardStats() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const [
      totalUsers,
      totalOrders,
      totalRevenue,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: true, items: true },
      }),
      prisma.product.findMany({
        where: { availableStock: { lte: 10 } },
        take: 5,
        orderBy: { availableStock: "asc" },
      }),
    ]);

    return {
      totalUsers,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      recentOrders,
      lowStockProducts,
    };
  } catch (error) {
    throw error;
  }
}

export async function updateInventory(
  productId: string,
  quantityChange: number,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const newTotalStock = product.totalStock + quantityChange;
    if (newTotalStock < 0) {
      throw new ApiError(400, "Insufficient stock for this operation");
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        totalStock: newTotalStock,
        availableStock: Math.max(0, product.availableStock + quantityChange),
      },
    });

    return updated;
  } catch (error) {
    throw error;
  }
}

export async function exportOrdersAsCSV() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      throw new ApiError(401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "ADMIN") {
      throw new ApiError(403, "Forbidden - Admin access required");
    }

    const orders = await prisma.order.findMany({
      include: { user: true, items: true, deliveryAddress: true },
      orderBy: { createdAt: "desc" },
    });

    // Convert to CSV format
    const headers = [
      "Order Number",
      "Customer",
      "Phone",
      "Amount",
      "Status",
      "Payment Status",
      "Created At",
    ];
    const rows = orders.map((order) => [
      order.orderNumber,
      `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim(),
      order.user.phone,
      order.totalAmount.toString(),
      order.status,
      order.paymentStatus,
      new Date(order.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    return csv;
  } catch (error) {
    throw error;
  }
}
