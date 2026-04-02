import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_TRANSITIONS: Record<string, string> = {
  ACCEPTED: "PICKED",
  PICKED: "IN_TRANSIT",
  IN_TRANSIT: "DELIVERED",
};

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-mobile-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { orderId, status } = await req.json();

    const order = await prisma.order.findFirst({
      where: { id: orderId, riderId: userId },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (VALID_TRANSITIONS[order.status] !== status) {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
