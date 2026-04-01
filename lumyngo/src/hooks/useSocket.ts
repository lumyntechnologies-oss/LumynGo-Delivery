"use client";

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket-client";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = getSocket();
    return () => {
      // Keep socket alive across components
    };
  }, []);

  return socketRef.current;
}

export function useOrderTracking(
  orderId: string,
  onLocationUpdate: (data: { lat: number; lng: number; riderId: string }) => void,
  onStatusUpdate: (data: { status: string }) => void
) {
  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();

    socket.emit("join-order", orderId);
    socket.on("location-update", onLocationUpdate);
    socket.on("status-update", onStatusUpdate);

    return () => {
      socket.off("location-update", onLocationUpdate);
      socket.off("status-update", onStatusUpdate);
    };
  }, [orderId, onLocationUpdate, onStatusUpdate]);
}

export function useRiderSocket(
  riderId: string,
  onNewOrder: (data: { orderId: string }) => void
) {
  useEffect(() => {
    if (!riderId) return;
    const socket = getSocket();

    socket.emit("join-rider", riderId);
    socket.on("order-available", onNewOrder);

    return () => {
      socket.off("order-available", onNewOrder);
    };
  }, [riderId, onNewOrder]);
}
