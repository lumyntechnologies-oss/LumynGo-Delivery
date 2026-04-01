import { Order, RiderStatus } from "@/types";

export async function getAvailableOrders(): Promise<{
  pendingOrders: Order[];
  activeOrder: Order | null;
}> {
  const res = await fetch("/api/rider/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function getRiderOrders(): Promise<Order[]> {
  const res = await fetch("/api/rider/orders?history=true");
  if (!res.ok) throw new Error("Failed to fetch rider orders");
  return res.json();
}

export async function acceptOrder(orderId: string): Promise<Order> {
  const res = await fetch("/api/rider/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed to accept order");
  return res.json();
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<Order> {
  const res = await fetch(`/api/orders/${orderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update order status");
  return res.json();
}

export async function updateRiderStatus(status: RiderStatus): Promise<void> {
  const res = await fetch("/api/rider/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update status");
}

export async function getRiderEarnings(): Promise<{
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  deliveries: number;
  orders: Order[];
}> {
  const res = await fetch("/api/rider/earnings");
  if (!res.ok) throw new Error("Failed to fetch earnings");
  return res.json();
}
