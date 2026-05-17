"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FA } from "@/lib/translations";

interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="font-persian">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 font-serif-persian">
          {FA.admin.categories}
        </h2>
        <Link
          href="/admin/categories/new"
          className="px-4 py-2 bg-luxury-primary text-white rounded hover:bg-luxury-hover font-persian"
        >
          + {FA.admin.addProduct}
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8 font-persian">{FA.common.loading}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  نام
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  شناسه
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  محصولات
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  وضعیت
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  اقدامات
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {category._count?.products || 0}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded text-white text-xs font-semibold ${
                        category.isActive ? "bg-green-500" : "bg-gray-500"
                      }`}
                    >
                      {category.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <Link
                      href={`/admin/categories/${category.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        if (confirm("Delete this category?")) {
                          // TODO: Implement delete
                        }
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
