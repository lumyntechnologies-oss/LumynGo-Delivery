import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("RIDER");
    const { lat, lng } = schema.parse(await req.json());

    if (!user.riderProfile) {
      return NextResponse.json({ error: "No rider profile" }, { status: 400 });
    }

    // Update current location on rider profile
    await prisma.riderProfile.update({
      where: { userId: user.id },
      data: { currentLat: lat, currentLng: lng },
    });

    // Record location history
    await prisma.locationTracking.create({
      data: {
        riderProfileId: user.riderProfile.id,
        lat,
        lng,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
