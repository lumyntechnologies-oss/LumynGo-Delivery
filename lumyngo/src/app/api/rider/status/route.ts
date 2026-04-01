import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum(["ONLINE", "OFFLINE", "BUSY"]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("RIDER");
    const { status } = schema.parse(await req.json());

    if (!user.riderProfile) {
      return NextResponse.json({ error: "No rider profile" }, { status: 400 });
    }

    await prisma.riderProfile.update({
      where: { userId: user.id },
      data: { status },
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
