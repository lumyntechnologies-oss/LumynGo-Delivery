import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, phone, role } = await req.json();

    if (!name || !phone || !role) {
      return NextResponse.json({ error: "Name, phone and role are required" }, { status: 400 });
    }

    if (!["CUSTOMER", "RIDER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const normalizedPhone = phone.replace(/\s+/g, "").replace(/^0/, "+254");
    const email = `${normalizedPhone}@mobile.lumyngo.app`;

    let user = await prisma.user.findFirst({
      where: { OR: [{ phone: normalizedPhone }, { email }] },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name, phone: normalizedPhone, role: role as "CUSTOMER" | "RIDER" },
      });
    } else {
      user = await prisma.user.create({
        data: {
          clerkId: `mobile_${normalizedPhone}_${Date.now()}`,
          email,
          name,
          phone: normalizedPhone,
          role: role as "CUSTOMER" | "RIDER",
        },
      });

      if (role === "RIDER") {
        await prisma.riderProfile.create({
          data: {
            userId: user.id,
            vehicleType: "MOTORCYCLE",
            license: `MOB-${Date.now()}`,
            status: "ONLINE",
          },
        });
      }
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      phone: user.phone ?? phone,
      role: user.role,
    });
  } catch (error) {
    console.error("[mobile/auth]", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
