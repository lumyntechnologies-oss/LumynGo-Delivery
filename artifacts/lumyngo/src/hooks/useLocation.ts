"use client";

import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@/lib/socket-client";

export function useGeolocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return { location, error, loading, refresh: getLocation };
}

export function useRiderLocationBroadcast(
  orderId: string | null,
  riderId: string | null,
  active: boolean
) {
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!active || !orderId || !riderId) {
      setIsTracking(false);
      return;
    }

    setIsTracking(true);
    const socket = getSocket();

    const interval = setInterval(() => {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition((pos) => {
        socket.emit("rider-location", {
          orderId,
          riderId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });

        // Also persist to DB
        fetch("/api/rider/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        }).catch(console.error);
      });
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsTracking(false);
    };
  }, [active, orderId, riderId]);

  return { isTracking };
}
