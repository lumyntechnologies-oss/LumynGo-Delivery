import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export async function GET() {
  try {
    const user = await requireRole("RIDER");
    const now = new Date();

    const deliveredOrders = await prisma.order.findMany({
      where: { riderId: user.id, status: "DELIVERED" },
      include: { payment: true },
      orderBy: { updatedAt: "desc" },
    });

    const total = deliveredOrders.reduce((sum, o) => sum + o.price * 0.8, 0);
    const today = deliveredOrders
      .filter((o) => o.updatedAt >= startOfDay(now))
      .reduce((sum, o) => sum + o.price * 0.8, 0);
    const thisWeek = deliveredOrders
      .filter((o) => o.updatedAt >= startOfWeek(now))
      .reduce((sum, o) => sum + o.price * 0.8, 0);
    const thisMonth = deliveredOrders
      .filter((o) => o.updatedAt >= startOfMonth(now))
      .reduce((sum, o) => sum + o.price * 0.8, 0);

    return NextResponse.json({
      total: Math.round(total),
      today: Math.round(today),
      thisWeek: Math.round(thisWeek),
      thisMonth: Math.round(thisMonth),
      deliveries: deliveredOrders.length,
      orders: deliveredOrders.slice(0, 20),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
