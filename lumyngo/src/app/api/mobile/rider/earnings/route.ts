import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-mobile-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const delivered = await prisma.order.findMany({
      where: { riderId: userId, status: "DELIVERED" },
      select: { price: true, updatedAt: true },
    });

    const earnings = (orders: typeof delivered) =>
      Math.round(orders.reduce((s, o) => s + o.price * 0.8, 0));

    return NextResponse.json({
      total: earnings(delivered),
      today: earnings(delivered.filter((o) => o.updatedAt >= startOfDay)),
      thisWeek: earnings(delivered.filter((o) => o.updatedAt >= startOfWeek)),
      thisMonth: earnings(delivered.filter((o) => o.updatedAt >= startOfMonth)),
      deliveries: delivered.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch earnings" }, { status: 500 });
  }
}
