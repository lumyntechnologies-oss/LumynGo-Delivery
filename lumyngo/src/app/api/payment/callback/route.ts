import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkTransactionStatus } from "@/lib/pesapal";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderTrackingId = searchParams.get("OrderTrackingId");
  const merchantReference = searchParams.get("OrderMerchantReference");

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    let paymentStatus: string;

    try {
      const status = await checkTransactionStatus(orderTrackingId);
      paymentStatus = status.payment_status_description ?? "PENDING";
    } catch {
      paymentStatus = "PENDING";
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId: merchantReference },
    });

    if (payment) {
      const dbStatus =
        paymentStatus === "Completed" ? "COMPLETED" :
        paymentStatus === "Failed" ? "FAILED" :
        "PENDING";

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: dbStatus,
          transactionId: orderTrackingId,
          pesapalRef: orderTrackingId,
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${process.env.REPLIT_DEV_DOMAIN}`;
    return NextResponse.redirect(
      new URL(`/track/${merchantReference}?payment=success`, baseUrl)
    );
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
}
