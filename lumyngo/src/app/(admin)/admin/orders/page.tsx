"use client";

import { useEffect, useState } from "react";
import { Package, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { getAllOrders } from "@/services/admin";
import { Order } from "@/types";
import { formatCurrency, formatDate, getOrderStatusColor, getOrderStatusLabel } from "@/lib/utils";
import AppNav from "@/components/shared/AppNav";

const STATUSES = ["", "PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"];

export default function AdminOrders() {
  const [data, setData] = useState<{ orders: Order[]; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    getAllOrders({ status: status || undefined, page, limit: 20 })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, status]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <AppNav role="ADMIN" />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Orders</h1>
            <p className="text-slate-400 text-sm mt-1">{data?.total ?? 0} total orders</p>
          </div>
          <select
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-slate-600"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s ? getOrderStatusLabel(s) : "All Statuses"}</option>
            ))}
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <div className="col-span-3">Route</div>
            <div className="col-span-2">Customer</div>
            <div className="col-span-2">Rider</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1">Date</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : (data?.orders ?? []).map((order) => (
            <div key={order.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-slate-800 last:border-0 items-center hover:bg-slate-800/20 transition-colors text-sm">
              <div className="col-span-3 min-w-0">
                <p className="text-slate-300 truncate text-xs">{order.pickupAddress}</p>
                <p className="text-slate-500 truncate text-xs">→ {order.dropoffAddress}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-300 text-xs truncate">{order.customer?.name ?? "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-300 text-xs truncate">{order.rider?.name ?? "Unassigned"}</p>
              </div>
              <div className="col-span-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                  {getOrderStatusLabel(order.status)}
                </span>
              </div>
              <div className="col-span-2">
                <p className="font-medium">{formatCurrency(order.price)}</p>
                <p className="text-slate-500 text-xs">{order.distance.toFixed(1)} km</p>
              </div>
              <div className="col-span-1">
                <p className="text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}

          {!loading && (data?.orders ?? []).length === 0 && (
            <div className="py-12 text-center">
              <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No orders found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {(data?.pages ?? 0) > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-slate-400">
              Page {page} of {data?.pages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data?.pages ?? 1, p + 1))}
                disabled={page === data?.pages}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-50 hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
