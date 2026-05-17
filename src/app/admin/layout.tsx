"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FA } from "@/lib/translations";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  // In production, verify admin role from session
  const isAdmin = true; // TODO: Check from NextAuth session

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-luxury-background">
        <div className="text-center font-persian">
          <h1 className="text-2xl font-bold text-red-600">
            {FA.errors.unauthorized}
          </h1>
          <p className="text-gray-600 mt-2">{FA.errors.forbidden}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-luxury-primary text-white rounded hover:bg-luxury-hover font-persian"
          >
            {FA.navigation.contact}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-persian">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white overflow-y-auto">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold font-serif-persian">
            {FA.admin.dashboard}
          </h2>
          <p className="text-sm text-gray-400 mt-1">پنل مدیریت</p>
        </div>

        <nav className="p-4 space-y-2">
          <Link
            href="/admin/dashboard"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            📊 {FA.admin.dashboard}
          </Link>
          <Link
            href="/admin/products"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            📦 {FA.admin.products}
          </Link>
          <Link
            href="/admin/orders"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            🛒 {FA.footer.orders}
          </Link>
          <Link
            href="/admin/users"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            👥 {FA.admin.users}
          </Link>
          <Link
            href="/admin/categories"
            className="block px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            🏷️ {FA.admin.categories}
          </Link>
          <hr className="my-4 border-gray-700" />
          <button
            onClick={() => router.push("/")}
            className="w-full text-left px-4 py-2 rounded hover:bg-gray-800 transition text-gray-300"
          >
            🏠 بازگشت به فروشگاه
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center font-persian">
          <h1 className="text-2xl font-bold text-gray-900 font-serif-persian">
            {FA.admin.dashboard}
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/admin/profile")}
              className="text-gray-600 hover:text-gray-900"
            >
              ⚙️ تنظیمات
            </button>
            <button
              onClick={() => router.push("/")}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              🚪 {FA.auth.logout}
            </button>
          </div>
        </header>

        <div className="p-6 font-persian">{children}</div>
      </main>
    </div>
  );
}
