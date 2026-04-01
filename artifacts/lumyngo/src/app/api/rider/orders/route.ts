import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireRole("RIDER");

    // Get pending orders (not yet accepted)
    const pendingOrders = await prisma.order.findMany({
      where: { status: "PENDING", riderId: null },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get this rider's active order
    const activeOrder = await prisma.order.findFirst({
      where: {
        riderId: user.id,
        status: { in: ["ACCEPTED", "PICKED", "IN_TRANSIT"] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({ pendingOrders, activeOrder });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
