"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Package,
  MapPin,
  Clock,
  CheckCircle,
  Plus,
  Loader2,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { Order } from "@/types";
import { getOrders } from "@/services/orders";
import { formatCurrency, formatDate, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import CreateOrderModal from "@/features/orders/CreateOrderModal";
import AppNav from "@/components/shared/AppNav";

export default function CustomerDashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch {
      console.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const activeOrders = orders.filter((o) =>
    ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT"].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === "DELIVERED");

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNav role="CUSTOMER" />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.firstName ?? "there"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your deliveries
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Delivery
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active Orders", value: activeOrders.length, icon: Truck, color: "text-blue-400" },
            { label: "Delivered", value: completedOrders.length, icon: CheckCircle, color: "text-green-400" },
            { label: "Total Orders", value: orders.length, icon: Package, color: "text-purple-400" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Active Orders */}
        {activeOrders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" /> Active Deliveries
            </h2>
            <div className="space-y-3">
              {activeOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/track/${order.id}`}
                  className="block bg-slate-900 border border-blue-500/30 rounded-2xl p-5 hover:border-blue-500/60 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}
                        >
                          {getOrderStatusLabel(order.status)}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {order.id.slice(0, 8)}...
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <span className="truncate">{order.pickupAddress}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span className="truncate">{order.dropoffAddress}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4 shrink-0">
                      <p className="font-bold text-lg">{formatCurrency(order.price)}</p>
                      <p className="text-slate-500 text-xs">{order.distance.toFixed(1)} km</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Order History</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">No orders yet</p>
              <p className="text-slate-500 text-sm mb-6">
                Create your first delivery to get started
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                Send a Package
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/track/${order.id}`}
                  className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate max-w-xs">
                        {order.pickupAddress} → {order.dropoffAddress}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <span className="font-semibold text-sm">
                      {formatCurrency(order.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}
