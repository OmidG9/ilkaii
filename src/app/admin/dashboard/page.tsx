"use client";

import { useEffect, useState } from "react";
import { FA } from "@/lib/translations";
import { formatPrice } from "@/lib/currency";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalUsers: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    // Fetch dashboard stats from API
    // TODO: Implement API call
    setStats({
      totalOrders: 1234,
      totalRevenue: 567890,
      totalProducts: 456,
      totalUsers: 789,
      pendingOrders: 45,
    });
  }, []);

  return (
    <div className="font-persian">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 font-serif-persian">
        {FA.admin.dashboard}
      </h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label={FA.admin.totalOrders}
          value={stats.totalOrders}
          icon="📋"
        />
        <StatCard
          label={FA.admin.totalRevenue}
          value={formatPrice(stats.totalRevenue)}
          icon="💰"
        />
        <StatCard
          label={FA.admin.totalProducts}
          value={stats.totalProducts}
          icon="📦"
        />
        <StatCard
          label={FA.admin.totalUsers}
          value={stats.totalUsers}
          icon="👥"
        />
        <StatCard
          label={FA.admin.pendingOrders}
          value={stats.pendingOrders}
          icon="⏳"
          highlight
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow font-persian">
          <h3 className="text-lg font-bold mb-4 font-serif-persian">
            {FA.admin.recentOrders}
          </h3>
          <div className="text-gray-500 text-center py-8">
            نمودار با استفاده از Chart.js یا Recharts پیاده‌سازی خواهد شد
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow font-persian">
          <h3 className="text-lg font-bold mb-4 font-serif-persian">
            {FA.admin.salesTrend}
          </h3>
          <div className="text-gray-500 text-center py-8">
            نمودار با استفاده از Chart.js یا Recharts پیاده‌سازی خواهد شد
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-6 rounded-lg shadow font-persian ${
        highlight ? "bg-orange-50 border-2 border-orange-400" : "bg-white"
      }`}
    >
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    </div>
  );
}
