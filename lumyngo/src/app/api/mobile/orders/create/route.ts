import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice, getDistanceFromGoogleMaps } from "@/lib/pricing";

function getUserId(req: NextRequest) {
  return req.headers.get("x-mobile-user-id");
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng, notes } = body;

    if (!pickupAddress || !dropoffAddress) {
      return NextResponse.json({ error: "Pickup and dropoff addresses required" }, { status: 400 });
    }

    const activeCount = await prisma.order.count({
      where: { status: { in: ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT"] } },
    });

    const distanceKm = await getDistanceFromGoogleMaps(pickupLat ?? 0, pickupLng ?? 0, dropoffLat ?? 0, dropoffLng ?? 0);
    const estimate = calculatePrice(distanceKm, activeCount);

    const order = await prisma.order.create({
      data: {
        customerId: userId,
        pickupAddress,
        pickupLat: pickupLat ?? 0,
        pickupLng: pickupLng ?? 0,
        dropoffAddress,
        dropoffLat: dropoffLat ?? 0,
        dropoffLng: dropoffLng ?? 0,
        price: estimate.price,
        distance: estimate.distance,
        notes: notes ?? null,
        status: "PENDING",
      },
      include: {
        rider: { select: { id: true, name: true, phone: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("[mobile/orders/create]", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
