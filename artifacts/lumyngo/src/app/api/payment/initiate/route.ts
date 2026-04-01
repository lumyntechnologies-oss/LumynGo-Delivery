import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitPesapalOrder } from "@/lib/pesapal";

const schema = z.object({ orderId: z.string() });

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { orderId } = schema.parse(await req.json());

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.customerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.payment?.status === "COMPLETED") {
      return NextResponse.json({ error: "Already paid" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}`;
    const callbackUrl = `${baseUrl}/api/payment/callback`;

    let redirectUrl: string;
    let pesapalRef: string;

    try {
      const result = await submitPesapalOrder({
        orderId,
        amount: order.price,
        description: `LumynGo Delivery - Order ${orderId.slice(0, 8)}`,
        customerEmail: user.email,
        customerPhone: user.phone ?? undefined,
        customerName: user.name,
        callbackUrl,
      });
      redirectUrl = result.redirect_url;
      pesapalRef = result.order_tracking_id;
    } catch {
      // PesaPal not configured — return mock for development
      redirectUrl = `/payment/success?orderId=${orderId}&mock=true`;
      pesapalRef = `MOCK_${Date.now()}`;
    }

    // Upsert payment record
    await prisma.payment.upsert({
      where: { orderId },
      update: { pesapalRef, status: "PENDING" },
      create: {
        orderId,
        amount: order.price,
        status: "PENDING",
        method: "PESAPAL",
        pesapalRef,
      },
    });

    return NextResponse.json({ redirectUrl, pesapalRef });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
