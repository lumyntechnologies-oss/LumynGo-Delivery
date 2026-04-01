import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireRole("ADMIN");

    const users = await prisma.user.findMany({
      include: {
        riderProfile: true,
        _count: {
          select: { customerOrders: true, riderOrders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

const updateSchema = z.object({
  userId: z.string(),
  role: z.enum(["CUSTOMER", "RIDER", "ADMIN"]),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const { userId, role } = updateSchema.parse(await req.json());

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { riderProfile: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
