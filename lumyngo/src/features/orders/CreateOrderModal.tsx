"use client";

import { useState } from "react";
import { X, MapPin, Tag, Loader2, AlertCircle } from "lucide-react";
import { createOrder, getPriceEstimate } from "@/services/orders";
import { PriceEstimate } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOrderModal({ onClose, onSuccess }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "estimate" | "paying">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [promoCode, setPromoCode] = useState("");

  const [form, setForm] = useState({
    pickupAddress: "",
    pickupLat: 0,
    pickupLng: 0,
    dropoffAddress: "",
    dropoffLat: 0,
    dropoffLng: 0,
    notes: "",
  });

  // Nairobi defaults for demo (users will input actual coordinates)
  const sampleLocations = [
    { label: "CBD Nairobi", lat: -1.2921, lng: 36.8219 },
    { label: "Westlands", lat: -1.2689, lng: 36.8073 },
    { label: "Karen", lat: -1.3173, lng: 36.7065 },
    { label: "Kilimani", lat: -1.2908, lng: 36.7889 },
    { label: "Ngong Road", lat: -1.3031, lng: 36.7822 },
    { label: "Thika Road", lat: -1.2195, lng: 36.8872 },
  ];

  const handleGetEstimate = async () => {
    if (!form.pickupAddress || !form.dropoffAddress) {
      setError("Please enter both pickup and dropoff addresses");
      return;
    }
    if (!form.pickupLat || !form.dropoffLat) {
      setError("Please select locations from the quick-select buttons");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const est = await getPriceEstimate(
        form.pickupLat,
        form.pickupLng,
        form.dropoffLat,
        form.dropoffLng
      );
      setEstimate(est);
      setStep("estimate");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get estimate");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const order = await createOrder({
        ...form,
        promoCode: promoCode || undefined,
      });
      onSuccess();
      router.push(`/track/${order.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create order");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">
            {step === "form" ? "New Delivery" : "Confirm Order"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {step === "form" && (
            <>
              {/* Pickup */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">
                  Pickup Location
                </label>
                <input
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 mb-2"
                  placeholder="Enter pickup address"
                  value={form.pickupAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pickupAddress: e.target.value }))
                  }
                />
                <div className="flex flex-wrap gap-1.5">
                  {sampleLocations.map((loc) => (
                    <button
                      key={loc.label}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          pickupAddress: loc.label,
                          pickupLat: loc.lat,
                          pickupLng: loc.lng,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        form.pickupAddress === loc.label
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dropoff */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">
                  Dropoff Location
                </label>
                <input
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 mb-2"
                  placeholder="Enter dropoff address"
                  value={form.dropoffAddress}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dropoffAddress: e.target.value }))
                  }
                />
                <div className="flex flex-wrap gap-1.5">
                  {sampleLocations.map((loc) => (
                    <button
                      key={loc.label}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          dropoffAddress: loc.label,
                          dropoffLat: loc.lat,
                          dropoffLng: loc.lng,
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        form.dropoffAddress === loc.label
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block uppercase tracking-wide">
                  Notes (optional)
                </label>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
                  rows={2}
                  placeholder="Any special instructions..."
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </div>

              <button
                onClick={handleGetEstimate}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Get Price Estimate"
                )}
              </button>
            </>
          )}

          {step === "estimate" && estimate && (
            <>
              {/* Route Summary */}
              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Pickup</p>
                    <p className="text-sm text-white">{form.pickupAddress}</p>
                  </div>
                </div>
                <div className="border-l-2 border-dashed border-slate-600 ml-1.5 pl-4 py-1 -my-1">
                  <p className="text-xs text-slate-500">
                    {estimate.distance.toFixed(1)} km
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Dropoff</p>
                    <p className="text-sm text-white">{form.dropoffAddress}</p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-800 rounded-xl p-4">
                <p className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wide">
                  Price Breakdown
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Base fare</span>
                    <span>{formatCurrency(estimate.breakdown.baseFare)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Distance ({estimate.distance.toFixed(1)} km)</span>
                    <span>
                      {formatCurrency(estimate.breakdown.distanceCharge)}
                    </span>
                  </div>
                  {estimate.breakdown.surgeMultiplier > 1 && (
                    <div className="flex justify-between text-orange-400">
                      <span>Surge pricing (×{estimate.breakdown.surgeMultiplier})</span>
                      <span>Active</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700 pt-2 flex justify-between font-bold text-white">
                    <span>Total</span>
                    <span>{formatCurrency(estimate.price)}</span>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 uppercase"
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("form")}
                  className="flex-1 border border-slate-700 hover:border-slate-600 text-slate-300 py-3 rounded-xl font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Place Order"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
