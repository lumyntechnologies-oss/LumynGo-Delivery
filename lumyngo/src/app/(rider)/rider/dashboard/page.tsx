"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { Truck, Package, MapPin, CheckCircle, Loader2, ToggleLeft, ToggleRight, Phone } from "lucide-react";
import { Order } from "@/types";
import { getAvailableOrders, acceptOrder, updateOrderStatus, updateRiderStatus } from "@/services/rider";
import { formatCurrency, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import { useRiderLocationBroadcast } from "@/hooks/useLocation";
import AppNav from "@/components/shared/AppNav";

export default function RiderDashboard() {
  const { user } = useUser();
  const [dbUser, setDbUser] = useState<{ id: string; riderProfile: { status: string } | null } | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const { isTracking } = useRiderLocationBroadcast(
    activeOrder?.id ?? null,
    dbUser?.id ?? null,
    !!activeOrder && activeOrder.status !== "DELIVERED"
  );

  const fetchData = useCallback(async () => {
    try {
      const [ordersData, userRes] = await Promise.all([
        getAvailableOrders(),
        fetch("/api/auth/sync").then((r) => r.json()),
      ]);
      setPendingOrders(ordersData.pendingOrders);
      setActiveOrder(ordersData.activeOrder);
      setDbUser(userRes);
      setIsOnline(userRes.riderProfile?.status === "ONLINE" || userRes.riderProfile?.status === "BUSY");
    } catch {
      console.error("Failed to fetch rider data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const newStatus = isOnline ? "OFFLINE" : "ONLINE";
      await updateRiderStatus(newStatus as "ONLINE" | "OFFLINE");
      setIsOnline(!isOnline);
    } catch {
      console.error("Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleAccept = async (orderId: string) => {
    setAccepting(orderId);
    try {
      const order = await acceptOrder(orderId);
      setActiveOrder(order);
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to accept order");
    } finally {
      setAccepting(null);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeOrder) return;
    try {
      const updated = await updateOrderStatus(activeOrder.id, newStatus);
      setActiveOrder(updated);
      if (newStatus === "DELIVERED") {
        setActiveOrder(null);
        fetchData();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const nextStatus: Record<string, string> = {
    ACCEPTED: "PICKED",
    PICKED: "IN_TRANSIT",
    IN_TRANSIT: "DELIVERED",
  };

  const nextLabel: Record<string, string> = {
    ACCEPTED: "Mark as Picked Up",
    PICKED: "Start Transit",
    IN_TRANSIT: "Mark as Delivered",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNav role="RIDER" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Status Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Welcome, {user?.firstName}</p>
              <p className={`text-sm mt-0.5 ${isOnline ? "text-green-400" : "text-slate-500"}`}>
                {isOnline ? "You are online and visible to customers" : "You are offline"}
              </p>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                isOnline
                  ? "bg-green-600/10 border border-green-600/30 text-green-400 hover:bg-green-600/20"
                  : "bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {togglingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isOnline ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
              {isOnline ? "Go Offline" : "Go Online"}
            </button>
          </div>
          {isTracking && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-xs text-green-400">Sharing live location</p>
            </div>
          )}
        </div>

        {/* Active Order */}
        {activeOrder && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
              Active Delivery
            </h2>
            <div className="bg-blue-600/5 border border-blue-500/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(activeOrder.status)}`}>
                  {getOrderStatusLabel(activeOrder.status)}
                </span>
                <span className="font-bold text-lg">{formatCurrency(activeOrder.price)}</span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                  <span>{activeOrder.pickupAddress}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <span>{activeOrder.dropoffAddress}</span>
                </div>
              </div>

              {activeOrder.customer && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold">
                      {activeOrder.customer.name?.charAt(0)}
                    </div>
                    <span className="text-sm text-slate-300">{activeOrder.customer.name}</span>
                  </div>
                  {activeOrder.customer.phone && (
                    <a href={`tel:${activeOrder.customer.phone}`}
                      className="flex items-center gap-1.5 text-green-400 text-sm">
                      <Phone className="w-3.5 h-3.5" />
                      Call
                    </a>
                  )}
                </div>
              )}

              {nextStatus[activeOrder.status] && (
                <button
                  onClick={() => handleUpdateStatus(nextStatus[activeOrder.status])}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  {nextLabel[activeOrder.status]}
                </button>
              )}

              {activeOrder.status === "DELIVERED" && (
                <div className="flex items-center justify-center gap-2 text-green-400 py-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Delivery Complete!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Available Orders */}
        {!activeOrder && (
          <div>
            <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-3">
              Available Orders ({pendingOrders.length})
            </h2>
            {pendingOrders.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
                <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No orders available</p>
                <p className="text-slate-600 text-sm mt-1">
                  {isOnline ? "Waiting for new orders..." : "Go online to receive orders"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div key={order.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 space-y-1.5 text-sm">
                        <div className="flex items-start gap-2 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-green-400 mt-0.5 shrink-0" />
                          <span className="truncate">{order.pickupAddress}</span>
                        </div>
                        <div className="flex items-start gap-2 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                          <span className="truncate">{order.dropoffAddress}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4 shrink-0">
                        <p className="font-bold text-lg">{formatCurrency(order.price)}</p>
                        <p className="text-slate-500 text-xs">{order.distance.toFixed(1)} km</p>
                        <p className="text-slate-500 text-xs">
                          ~{formatCurrency(order.price * 0.8)} earned
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={!!accepting}
                      className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {accepting === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Truck className="w-4 h-4" />
                          Accept Delivery
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
