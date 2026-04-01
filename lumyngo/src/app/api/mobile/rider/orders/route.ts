import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-mobile-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const pendingOrders = await prisma.order.findMany({
      where: { status: "PENDING", riderId: null },
      include: { customer: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });

    const activeOrder = await prisma.order.findFirst({
      where: { riderId: userId, status: { in: ["ACCEPTED", "PICKED", "IN_TRANSIT"] } },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });

    return NextResponse.json({ pendingOrders, activeOrder });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
