"use client";

import { useEffect, useState } from "react";
import { FA } from "@/lib/translations";

interface User {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
  isVerified: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function fetchUsers() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/users?page=${page}&pageSize=20`,
        {
          headers: { "x-user-role": "ADMIN" },
        },
      );
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.data);
        setTotal(data.data.total);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="font-persian">
      <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif-persian">
        {FA.admin.users}
      </h2>

      {loading ? (
        <div className="text-center py-8 font-persian">{FA.common.loading}</div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    نام
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    تلفن
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    ایمیل
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    نقش
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    تایید شده
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    تاریخ عضویت
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : "ندارد"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email || "ندارد"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded text-white text-xs font-semibold ${
                          user.role === "ADMIN" ? "bg-red-500" : "bg-blue-500"
                        }`}
                      >
                        {user.role === "ADMIN" ? "مدیر" : "کاربر"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {user.isVerified ? "✓" : "✗"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString("fa-IR")}
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
