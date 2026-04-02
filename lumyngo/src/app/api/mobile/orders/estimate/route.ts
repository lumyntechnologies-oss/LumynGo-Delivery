import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePrice, getDistanceFromGoogleMaps } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pLat = parseFloat(searchParams.get("pLat") ?? "0");
  const pLng = parseFloat(searchParams.get("pLng") ?? "0");
  const dLat = parseFloat(searchParams.get("dLat") ?? "0");
  const dLng = parseFloat(searchParams.get("dLng") ?? "0");

  try {
    const activeCount = await prisma.order.count({
      where: { status: { in: ["PENDING", "ACCEPTED", "PICKED", "IN_TRANSIT"] } },
    });
    const distanceKm = await getDistanceFromGoogleMaps(pLat, pLng, dLat, dLng);
    const result = calculatePrice(distanceKm, activeCount);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to estimate" }, { status: 500 });
  }
}
