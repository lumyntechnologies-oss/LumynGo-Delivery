"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, MapPin, Loader2 } from "lucide-react";
import { Order } from "@/types";
import { getOrders } from "@/services/orders";
import { formatCurrency, formatDate, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import AppNav from "@/components/shared/AppNav";
import Link from "next/link";

const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Active", value: "active" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

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

  const ACTIVE_STATUSES = ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT"];

  const filtered = orders.filter((o) => {
    if (!filter) return true;
    if (filter === "active") return ACTIVE_STATUSES.includes(o.status);
    return o.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNav role="CUSTOMER" />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Orders</h1>
          <span className="text-slate-500 text-sm">{orders.length} total</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No orders found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <Link
                key={order.id}
                href={`/track/${order.id}`}
                className="block bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <span className="text-slate-500 text-xs">{order.id.slice(0, 8)}</span>
                  </div>
                  <span className="font-bold">{formatCurrency(order.price)}</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="truncate">{order.pickupAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">{order.dropoffAddress}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                  <span className="text-xs text-slate-500">{formatDate(order.createdAt)}</span>
                  <span className="text-xs text-slate-500">{order.distance.toFixed(1)} km</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
