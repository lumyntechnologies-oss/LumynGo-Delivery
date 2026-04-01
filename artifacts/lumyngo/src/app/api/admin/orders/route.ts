import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);
    const skip = (page - 1) * limit;

    const where = status ? { status: status as never } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          rider: { select: { id: true, name: true, phone: true } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

const assignSchema = z.object({
  orderId: z.string(),
  riderId: z.string(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const { orderId, riderId } = assignSchema.parse(await req.json());

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { riderId, status: "ACCEPTED" },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        rider: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
