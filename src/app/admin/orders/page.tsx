"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FA } from "@/lib/translations";
import { formatPrice } from "@/lib/currency";

interface Order {
  id: string;
  orderNumber: string;
  user: { phone: string; firstName?: string };
  totalAmount: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: "20",
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/orders?${query}`, {
        headers: { "x-user-role": "ADMIN" },
      });
      const data = await response.json();
      if (data.success) {
        setOrders(data.data.data);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="font-persian">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 font-serif-persian">
          {FA.admin.orders}
        </h2>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded font-persian"
        >
          <option value="">تمام وضعیت‌ها</option>
          <option value="PENDING">در انتظار</option>
          <option value="CONFIRMED">تایید شده</option>
          <option value="PROCESSING">در حال پردازش</option>
          <option value="SHIPPED">ارسال شده</option>
          <option value="DELIVERED">تحویل شده</option>
          <option value="CANCELLED">لغو شده</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 font-persian">{FA.common.loading}</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    شماره سفارش
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    مشتری
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    مبلغ
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    وضعیت پرداخت
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    تاریخ
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.user.firstName || order.user.phone}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatPrice(order.totalAmount, false)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded text-white text-xs font-semibold ${
                          order.paymentStatus === "COMPLETED"
                            ? "bg-green-500"
                            : "bg-yellow-500"
                        }`}
                      >
                        {order.paymentStatus === "COMPLETED"
                          ? "تکمیل شده"
                          : "در انتظار"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded text-white text-xs font-semibold ${
                          order.status === "DELIVERED"
                            ? "bg-blue-500"
                            : order.status === "PENDING"
                              ? "bg-orange-500"
                              : "bg-purple-500"
                        }`}
                      >
                        {order.status === "DELIVERED"
                          ? "تحویل شده"
                          : order.status === "PENDING"
                            ? "در انتظار"
                            : "در حال پردازش"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        مشاهده
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex justify-center items-center space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
