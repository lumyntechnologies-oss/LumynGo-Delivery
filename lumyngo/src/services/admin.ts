import { DashboardStats, Order, User } from "@/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

export async function getAllUsers(): Promise<User[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<User> {
  const res = await fetch(`/api/admin/users`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role }),
  });
  if (!res.ok) throw new Error("Failed to update user role");
  return res.json();
}

export async function getAllOrders(params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ orders: Order[]; total: number; pages: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const res = await fetch(`/api/admin/orders?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function assignRiderToOrder(
  orderId: string,
  riderId: string
): Promise<Order> {
  const res = await fetch(`/api/admin/orders`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, riderId }),
  });
  if (!res.ok) throw new Error("Failed to assign rider");
  return res.json();
}
