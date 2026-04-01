import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      // Admin listing all promo codes
      await requireRole("ADMIN");
      const promos = await prisma.promoCode.findMany({
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(promos);
    }

    await requireAuth();
    const promo = await prisma.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!promo) {
      return NextResponse.json({ error: "Invalid or expired promo code" }, { status: 404 });
    }

    if (promo.usedCount >= promo.maxUses) {
      return NextResponse.json({ error: "Promo code fully used" }, { status: 410 });
    }

    return NextResponse.json({
      valid: true,
      discount: promo.discount,
      isPercent: promo.isPercent,
      code: promo.code,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

const createPromoSchema = z.object({
  code: z.string().min(3),
  discount: z.number().positive(),
  isPercent: z.boolean().default(true),
  maxUses: z.number().int().positive().default(100),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
    const data = createPromoSchema.parse(await req.json());

    const promo = await prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        discount: data.discount,
        isPercent: data.isPercent,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    return NextResponse.json(promo, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const msg = error instanceof Error ? error.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
