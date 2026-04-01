import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ orderId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("RIDER");
    const { orderId } = schema.parse(await req.json());

    // Check rider doesn't already have an active order
    const activeOrder = await prisma.order.findFirst({
      where: {
        riderId: user.id,
        status: { in: ["ACCEPTED", "PICKED", "IN_TRANSIT"] },
      },
    });

    if (activeOrder) {
      return NextResponse.json(
        { error: "You already have an active delivery" },
        { status: 400 }
      );
    }

    // Accept the order atomically
    const order = await prisma.order.update({
      where: { id: orderId, status: "PENDING", riderId: null },
      data: {
        riderId: user.id,
        status: "ACCEPTED",
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    // Update rider status to BUSY
    await prisma.riderProfile.update({
      where: { userId: user.id },
      data: { status: "BUSY" },
    });

    // Notify via socket
    const io = (global as { io?: { to: Function; emit: Function } }).io;
    if (io) {
      io.to(`order-${orderId}`).emit("status-update", {
        orderId,
        status: "ACCEPTED",
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    if (msg.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Order no longer available" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
