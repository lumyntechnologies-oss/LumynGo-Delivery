import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-mobile-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { orderId } = await req.json();
    const existing = await prisma.order.findFirst({
      where: { riderId: userId, status: { in: ["ACCEPTED", "PICKED", "IN_TRANSIT"] } },
    });
    if (existing) return NextResponse.json({ error: "You already have an active delivery" }, { status: 400 });

    const order = await prisma.order.update({
      where: { id: orderId, status: "PENDING" },
      data: { riderId: userId, status: "ACCEPTED" },
      include: { customer: { select: { id: true, name: true, phone: true } } },
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Failed to accept order" }, { status: 500 });
  }
}
