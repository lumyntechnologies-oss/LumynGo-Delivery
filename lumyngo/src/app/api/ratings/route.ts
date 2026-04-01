import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ratingSchema = z.object({
  orderId: z.string(),
  toUserId: z.string(),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const data = ratingSchema.parse(await req.json());

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Can only rate delivered orders" },
        { status: 400 }
      );
    }

    // Check authorization
    if (order.customerId !== user.id && order.riderId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if already rated
    const existing = await prisma.rating.findFirst({
      where: { orderId: data.orderId, fromUserId: user.id },
    });

    if (existing) {
      return NextResponse.json({ error: "Already rated" }, { status: 409 });
    }

    const rating = await prisma.rating.create({
      data: {
        orderId: data.orderId,
        fromUserId: user.id,
        toUserId: data.toUserId,
        score: data.score,
        comment: data.comment,
      },
    });

    return NextResponse.json(rating, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
