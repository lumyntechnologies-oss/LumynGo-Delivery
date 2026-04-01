import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDistanceFromGoogleMaps, calculatePrice, applyPromoCode } from "@/lib/pricing";

const createOrderSchema = z.object({
  pickupAddress: z.string().min(1),
  pickupLat: z.number(),
  pickupLng: z.number(),
  dropoffAddress: z.string().min(1),
  dropoffLat: z.number(),
  dropoffLng: z.number(),
  notes: z.string().optional(),
  promoCode: z.string().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();

    let orders;
    if (user.role === "CUSTOMER") {
      orders = await prisma.order.findMany({
        where: { customerId: user.id },
        include: {
          rider: { select: { id: true, name: true, phone: true, riderProfile: true } },
          payment: true,
          ratings: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === "RIDER") {
      orders = await prisma.order.findMany({
        where: { riderId: user.id },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      orders = await prisma.order.findMany({
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          rider: { select: { id: true, name: true, phone: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });
    }

    return NextResponse.json(orders);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Only customers can place orders" }, { status: 403 });
    }

    const body = await req.json();
    const data = createOrderSchema.parse(body);

    const distance = await getDistanceFromGoogleMaps(
      data.pickupLat,
      data.pickupLng,
      data.dropoffLat,
      data.dropoffLng
    );

    const activeOrders = await prisma.order.count({
      where: { status: { in: ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT"] } },
    });

    const estimate = calculatePrice(distance, activeOrders);
    let finalPrice = estimate.price;
    let promoCodeId: string | undefined;

    if (data.promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: {
          code: data.promoCode,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });
      // Check usage limit
      const promoValid = promo && promo.usedCount < promo.maxUses;

      if (promoValid && promo) {
        finalPrice = applyPromoCode(finalPrice, promo.discount, promo.isPercent);
        promoCodeId = promo.id;
        await prisma.promoCode.update({
          where: { id: promo.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const order = await prisma.order.create({
      data: {
        pickupAddress: data.pickupAddress,
        pickupLat: data.pickupLat,
        pickupLng: data.pickupLng,
        dropoffAddress: data.dropoffAddress,
        dropoffLat: data.dropoffLat,
        dropoffLng: data.dropoffLng,
        notes: data.notes,
        price: finalPrice,
        distance,
        customerId: user.id,
        promoCodeId,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        payment: true,
      },
    });

    // Notify riders via socket
    const io = (global as { io?: { emit: Function } }).io;
    if (io) {
      io.emit("order-available", { orderId: order.id });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
