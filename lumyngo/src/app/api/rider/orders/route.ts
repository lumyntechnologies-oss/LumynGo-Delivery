import { NextResponse, NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole("RIDER");
    const { searchParams } = new URL(req.url);
    const history = searchParams.get("history") === "true";

    if (history) {
      const orders = await prisma.order.findMany({
        where: { riderId: user.id },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(orders);
    }

    const pendingOrders = await prisma.order.findMany({
      where: { status: "PENDING", riderId: null },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

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
