import { Order, PriceEstimate } from "@/types";

export async function createOrder(data: {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  notes?: string;
  promoCode?: string;
}): Promise<Order> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? "Failed to create order");
  return res.json();
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders");
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function getOrder(id: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}`);
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
}

export async function getPriceEstimate(
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number
): Promise<PriceEstimate> {
  const res = await fetch(
    `/api/orders/estimate?pickupLat=${pickupLat}&pickupLng=${pickupLng}&dropoffLat=${dropoffLat}&dropoffLng=${dropoffLng}`
  );
  if (!res.ok) throw new Error("Failed to get estimate");
  return res.json();
}

export async function cancelOrder(id: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "CANCELLED" }),
  });
  if (!res.ok) throw new Error("Failed to cancel order");
  return res.json();
}

export async function rateOrder(data: {
  orderId: string;
  toUserId: string;
  score: number;
  comment?: string;
}): Promise<void> {
  const res = await fetch("/api/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to submit rating");
}
