"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Package, DollarSign, Loader2, Calendar } from "lucide-react";
import { getRiderEarnings } from "@/services/rider";
import { formatCurrency, formatDate } from "@/lib/utils";
import AppNav from "@/components/shared/AppNav";

interface EarningsData {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  deliveries: number;
  orders: { id: string; price: number; updatedAt: Date; dropoffAddress: string }[];
}

export default function RiderEarnings() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRiderEarnings()
      .then(setData)
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
      <AppNav role="RIDER" />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Earnings</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { label: "Today", value: data?.today ?? 0, icon: Calendar, color: "text-blue-400" },
            { label: "This Week", value: data?.thisWeek ?? 0, icon: TrendingUp, color: "text-green-400" },
            { label: "This Month", value: data?.thisMonth ?? 0, icon: DollarSign, color: "text-purple-400" },
            { label: "Total Deliveries", value: data?.deliveries ?? 0, icon: Package, color: "text-orange-400", isCurrency: false },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm">{s.label}</span>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold">
                {(s as { isCurrency?: boolean }).isCurrency === false
                  ? s.value
                  : formatCurrency(s.value)}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6">
          <p className="text-xs text-slate-500 text-center">
            Earnings are 80% of delivery price after platform fees
          </p>
        </div>

        {/* Recent Deliveries */}
        <h2 className="text-lg font-semibold mb-4">Delivery History</h2>
        {data?.orders.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No deliveries yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div>
                  <p className="text-sm text-slate-300 truncate max-w-xs">{order.dropoffAddress}</p>
                  <p className="text-xs text-slate-500">{formatDate(order.updatedAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-400">
                    +{formatCurrency(Math.round(order.price * 0.8))}
                  </p>
                  <p className="text-xs text-slate-500">{formatCurrency(order.price)} total</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
