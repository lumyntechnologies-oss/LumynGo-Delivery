import { NextRequest, NextResponse } from "next/server";
import { getDistanceFromGoogleMaps, calculatePrice } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pickupLat = parseFloat(searchParams.get("pickupLat") ?? "");
    const pickupLng = parseFloat(searchParams.get("pickupLng") ?? "");
    const dropoffLat = parseFloat(searchParams.get("dropoffLat") ?? "");
    const dropoffLng = parseFloat(searchParams.get("dropoffLng") ?? "");

    if ([pickupLat, pickupLng, dropoffLat, dropoffLng].some(isNaN)) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    const distance = await getDistanceFromGoogleMaps(
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng
    );

    const activeOrders = await prisma.order.count({
      where: { status: { in: ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT"] } },
    });

    const estimate = calculatePrice(distance, activeOrders);
    return NextResponse.json(estimate);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
