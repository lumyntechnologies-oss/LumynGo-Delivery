import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const [
      totalOrders,
      activeOrders,
      totalUsers,
      activeRiders,
      ordersByStatus,
      recentOrders,
      paymentsData,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({
        where: { status: { in: ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT"] } },
      }),
      prisma.user.count(),
      prisma.riderProfile.count({ where: { status: "ONLINE" } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          rider: { select: { id: true, name: true } },
          payment: true,
        },
      }),
      prisma.payment.findMany({
        where: { status: "COMPLETED", createdAt: { gte: subDays(new Date(), 7) } },
        select: { amount: true, createdAt: true },
      }),
    ]);

    const totalRevenue = paymentsData.reduce((sum, p) => sum + p.amount, 0);

    // Daily revenue for last 7 days
    const dailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(new Date(), i);
      const dayStart = startOfDay(day);
      const dayEnd = startOfDay(subDays(new Date(), i - 1));
      const dayPayments = paymentsData.filter(
        (p) => p.createdAt >= dayStart && p.createdAt < dayEnd
      );
      const dayOrders = await prisma.order.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      });
      dailyRevenue.push({
        date: format(day, "MMM dd"),
        revenue: Math.round(dayPayments.reduce((s, p) => s + p.amount, 0)),
        orders: dayOrders,
      });
    }

    const statusCounts: Record<string, number> = {};
    ordersByStatus.forEach((s) => {
      statusCounts[s.status] = s._count._all;
    });

    return NextResponse.json({
      totalOrders,
      activeOrders,
      totalRevenue: Math.round(totalRevenue),
      activeRiders,
      totalUsers,
      ordersByStatus: statusCounts,
      recentOrders,
      dailyRevenue,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
