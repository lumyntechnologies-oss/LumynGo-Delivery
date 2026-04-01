"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, MapPin, Loader2, CheckCircle } from "lucide-react";
import { Order } from "@/types";
import { getRiderOrders } from "@/services/rider";
import { formatCurrency, formatDate, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import AppNav from "@/components/shared/AppNav";

export default function RiderOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getRiderOrders();
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNav role="RIDER" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Deliveries</h1>
          <span className="text-slate-500 text-sm">{orders.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No deliveries yet</p>
            <p className="text-slate-500 text-sm mt-1">Accept orders to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(order.price)}</p>
                    <p className="text-green-400 text-xs">+{formatCurrency(Math.round(order.price * 0.8))}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-green-400 shrink-0" />
                    <span className="truncate">{order.pickupAddress}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate">{order.dropoffAddress}</span>
                  </div>
                </div>
                {order.customer && (
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {order.customer.name?.charAt(0)}
                    </div>
                    <span className="text-xs text-slate-400">{order.customer.name}</span>
                    {order.status === "DELIVERED" && (
                      <CheckCircle className="w-4 h-4 text-green-400 ml-auto" />
                    )}
                  </div>
                )}
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-slate-600">{formatDate(order.createdAt)}</span>
                  <span className="text-xs text-slate-600">{order.distance.toFixed(1)} km</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
