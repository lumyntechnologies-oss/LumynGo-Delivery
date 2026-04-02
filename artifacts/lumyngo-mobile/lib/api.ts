const getBase = () => {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "http://localhost:3000";
};

export interface Order {
  id: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  price: number;
  distance: number;
  notes?: string;
  createdAt: string;
  rider?: { id: string; name: string; phone?: string } | null;
  customer?: { id: string; name: string; phone?: string } | null;
}

export interface PriceEstimate {
  price: number;
  distance: number;
  breakdown: { baseFare: number; distanceCharge: number; surgeMultiplier: number };
}

async function request<T>(
  path: string,
  userId: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${getBase()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-mobile-user-id": userId,
      ...(options.headers as Record<string, string>),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

// Auth
export async function registerUser(body: {
  name: string;
  phone: string;
  role: string;
}): Promise<{ id: string; name: string; phone: string; role: string }> {
  const res = await fetch(`${getBase()}/api/mobile/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Registration failed");
  return data;
}

// Customer orders
export const getMyOrders = (userId: string) =>
  request<Order[]>("/api/mobile/orders", userId);

export const getOrder = (userId: string, orderId: string) =>
  request<Order>(`/api/mobile/orders/${orderId}`, userId);

export const getPriceEstimate = (
  userId: string,
  pickupLat: number,
  pickupLng: number,
  dropoffLat: number,
  dropoffLng: number
) =>
  request<PriceEstimate>(
    `/api/mobile/orders/estimate?pLat=${pickupLat}&pLng=${pickupLng}&dLat=${dropoffLat}&dLng=${dropoffLng}`,
    userId
  );

export const createOrder = (
  userId: string,
  body: {
    pickupAddress: string;
    pickupLat: number;
    pickupLng: number;
    dropoffAddress: string;
    dropoffLat: number;
    dropoffLng: number;
    notes?: string;
  }
) => request<Order>("/api/mobile/orders/create", userId, { method: "POST", body: JSON.stringify(body) });

// Rider
export const getAvailableOrders = (userId: string) =>
  request<{ pendingOrders: Order[]; activeOrder: Order | null }>("/api/mobile/rider/orders", userId);

export const acceptOrder = (userId: string, orderId: string) =>
  request<Order>("/api/mobile/rider/accept", userId, {
    method: "POST",
    body: JSON.stringify({ orderId }),
  });

export const updateOrderStatus = (userId: string, orderId: string, status: string) =>
  request<Order>("/api/mobile/rider/update", userId, {
    method: "POST",
    body: JSON.stringify({ orderId, status }),
  });

export const getRiderEarnings = (userId: string) =>
  request<{
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    deliveries: number;
  }>("/api/mobile/rider/earnings", userId);
