import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            riderProfile: {
              select: { vehicleType: true, status: true, currentLat: true, currentLng: true },
            },
          },
        },
        payment: true,
        ratings: true,
        promoCode: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Access check
    if (
      user.role === "CUSTOMER" && order.customerId !== user.id ||
      user.role === "RIDER" && order.riderId !== user.id && order.status !== "PENDING"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { status } = updateOrderSchema.parse(body);

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization
    if (user.role === "CUSTOMER") {
      if (order.customerId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (status !== "CANCELLED") {
        return NextResponse.json({ error: "Customers can only cancel orders" }, { status: 403 });
      }
    }

    if (user.role === "RIDER") {
      if (order.riderId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const allowedTransitions: Record<string, string[]> = {
        ACCEPTED: ["PICKED"],
        PICKED: ["IN_TRANSIT"],
        IN_TRANSIT: ["DELIVERED"],
      };
      if (!allowedTransitions[order.status]?.includes(status)) {
        return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        rider: { select: { id: true, name: true, phone: true } },
      },
    });

    // If delivered, update rider status back to ONLINE
    if (status === "DELIVERED" && order.riderId) {
      await prisma.riderProfile.update({
        where: { userId: order.riderId },
        data: { status: "ONLINE" },
      });
      // Create payment record as completed
      await prisma.payment.upsert({
        where: { orderId: id },
        update: { status: "COMPLETED" },
        create: {
          orderId: id,
          amount: order.price,
          status: "COMPLETED",
          method: "PESAPAL",
        },
      });
    }

    // Emit socket event
    const io = (global as { io?: { to: Function; emit: Function } }).io;
    if (io) {
      io.to(`order-${id}`).emit("status-update", { orderId: id, status });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
