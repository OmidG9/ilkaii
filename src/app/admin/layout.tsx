"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  // In production, verify admin role from session
  const isAdmin = true; // TODO: Check from NextAuth session

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You do not have admin access</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-sm text-gray-400 mt-1">Management Dashboard</p>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            href="/admin/dashboard"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            📊 Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            📦 Products
          </Link>
          <Link
            href="/admin/orders"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            🛒 Orders
          </Link>
          <Link
            href="/admin/users"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            👥 Users
          </Link>
          <Link
            href="/admin/categories"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            🏷️ Categories
          </Link>
          <hr className="my-4 border-gray-700" />
          <button
            onClick={() => router.push("/")}
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition text-gray-300"
          >
            🏠 Back to Store
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/admin/profile")}
              className="text-gray-600 hover:text-gray-900"
            >
              ⚙️ Profile
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              🚪 Logout
            </button>
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
