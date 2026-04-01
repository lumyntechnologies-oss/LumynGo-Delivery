"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Package, MapPin, Phone, Clock, Loader2, CheckCircle } from "lucide-react";
import { Order } from "@/types";
import { getOrder } from "@/services/orders";
import { formatCurrency, formatDate, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import { useOrderTracking } from "@/hooks/useSocket";
import AppNav from "@/components/shared/AppNav";
import Link from "next/link";

const STATUS_STEPS = ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT", "DELIVERED"];

export default function TrackOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const data = await getOrder(orderId);
      setOrder(data);
    } catch {
      console.error("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  useOrderTracking(
    orderId,
    useCallback((loc) => setRiderLocation(loc), []),
    useCallback((data) => {
      setOrder((prev) => prev ? { ...prev, status: data.status as Order["status"] } : prev);
    }, [])
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Order not found</p>
          <Link href="/dashboard" className="text-blue-400 text-sm mt-2 block">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNav role="CUSTOMER" />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Order Status Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">Order #{order.id.slice(0, 8)}</p>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}>
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(order.price)}</p>
              <p className="text-slate-500 text-sm">{order.distance.toFixed(1)} km</p>
            </div>
          </div>

          {/* Progress Steps */}
          {order.status !== "CANCELLED" && (
            <div className="relative mt-6">
              <div className="flex justify-between relative z-10">
                {STATUS_STEPS.map((step, i) => {
                  const isDone = i <= currentStepIndex;
                  const isActive = i === currentStepIndex;
                  return (
                    <div key={step} className="flex flex-col items-center gap-1.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isDone
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-slate-800 border-slate-700 text-slate-500"
                      } ${isActive ? "ring-2 ring-blue-500/30 ring-offset-2 ring-offset-slate-900" : ""}`}>
                        {isDone && !isActive ? <CheckCircle className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-xs text-center leading-tight ${isDone ? "text-blue-400" : "text-slate-600"}`}>
                        {getOrderStatusLabel(step)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-slate-800 -z-0">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Route */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-4">Route</p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Pickup</p>
                <p className="text-sm text-white">{order.pickupAddress}</p>
              </div>
            </div>
            <div className="border-l-2 border-dashed border-slate-700 ml-0.5 pl-6 py-1 -my-1">
              <Clock className="w-3 h-3 text-slate-600" />
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Dropoff</p>
                <p className="text-sm text-white">{order.dropoffAddress}</p>
              </div>
            </div>
          </div>
          {order.notes && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">Notes</p>
              <p className="text-sm text-slate-300 mt-1">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Rider Info */}
        {order.rider && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Your Rider</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center">
                  <span className="text-blue-400 font-bold">{order.rider.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium">{order.rider.name}</p>
                  {order.rider.riderProfile && (
                    <p className="text-xs text-slate-500 capitalize">
                      {order.rider.riderProfile.vehicleType.toLowerCase()}
                    </p>
                  )}
                </div>
              </div>
              {order.rider.phone && (
                <a
                  href={`tel:${order.rider.phone}`}
                  className="flex items-center gap-2 bg-green-600/10 border border-green-600/20 text-green-400 px-3 py-2 rounded-xl text-sm hover:bg-green-600/20 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
              )}
            </div>
            {riderLocation && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-500">
                  Live location: {riderLocation.lat.toFixed(4)}, {riderLocation.lng.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Payment */}
        {order.payment && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Payment</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">{order.payment.method}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                order.payment.status === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : order.payment.status === "FAILED"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {order.payment.status}
              </span>
            </div>
            {order.payment.status === "PENDING" && order.status !== "CANCELLED" && (
              <button
                onClick={async () => {
                  const res = await fetch("/api/payment/initiate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: order.id }),
                  });
                  const data = await res.json();
                  if (data.redirectUrl) window.location.href = data.redirectUrl;
                }}
                className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Pay {formatCurrency(order.price)} via PesaPal
              </button>
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-slate-600">
            Last updated: {formatDate(new Date())}
          </p>
        </div>
      </main>
    </div>
  );
}
