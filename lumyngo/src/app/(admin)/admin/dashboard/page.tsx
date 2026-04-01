"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Users,
  TrendingUp,
  Truck,
  Loader2,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getDashboardStats } from "@/services/admin";
import { DashboardStats } from "@/types";
import { formatCurrency, formatDate, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import AppNav from "@/components/shared/AppNav";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNav role="ADMIN" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">System overview</p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            <span className="text-green-400 text-sm">Live</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: Package, color: "text-blue-400" },
            { label: "Active Orders", value: stats?.activeOrders ?? 0, icon: Truck, color: "text-orange-400" },
            { label: "Active Riders", value: stats?.activeRiders ?? 0, icon: Users, color: "text-green-400" },
            { label: "Total Revenue", value: formatCurrency(stats?.totalRevenue ?? 0), icon: TrendingUp, color: "text-purple-400", raw: true },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-xs">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">
                {(s as { raw?: boolean }).raw ? s.value : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        {stats?.dailyRevenue && stats.dailyRevenue.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
              Revenue — Last 7 Days
            </h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.dailyRevenue}>
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }}
                  formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Status Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-4">
              Orders by Status
            </h2>
            <div className="space-y-3">
              {Object.entries(stats?.ordersByStatus ?? {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(status)}`}>
                    {getOrderStatusLabel(status)}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.min((count / (stats?.totalOrders ?? 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
                Recent Orders
              </h2>
              <Link href="/admin/orders" className="text-blue-400 text-xs hover:text-blue-300">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {(stats?.recentOrders ?? []).slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-300 truncate">
                      {order.pickupAddress} → {order.dropoffAddress}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <span className="text-sm font-medium">{formatCurrency(order.price)}</span>
                  </div>
                </div>
              ))}
              {(stats?.recentOrders ?? []).length === 0 && (
                <p className="text-slate-500 text-sm text-center py-4">No orders yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
