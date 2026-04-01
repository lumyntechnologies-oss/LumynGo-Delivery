import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { Role } from "@prisma/client";

export async function getAuthUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { riderProfile: true },
  });

  return user;
}

export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { riderProfile: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function requireRole(role: Role) {
  const user = await requireAuth();
  if (user.role !== role) {
    throw new Error("Forbidden");
  }
  return user;
}

export function isAdminClerkId(clerkId: string): boolean {
  const adminIds = process.env.ADMIN_USER_IDS?.split(",").map((id) =>
    id.trim()
  ) ?? [];
  return adminIds.includes(clerkId);
}

export async function syncUserWithDB() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const adminIds = process.env.ADMIN_USER_IDS?.split(",").map((id) =>
    id.trim()
  ) ?? [];
  const isAdmin = adminIds.includes(clerkUser.id);

  const email =
    clerkUser.emailAddresses[0]?.emailAddress ?? `${clerkUser.id}@lumyngo.com`;
  const name =
    `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
    "User";

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUser.id },
    update: {
      name,
      email,
      role: isAdmin ? Role.ADMIN : undefined,
    },
    create: {
      clerkId: clerkUser.id,
      name,
      email,
      phone: clerkUser.phoneNumbers[0]?.phoneNumber,
      role: isAdmin ? Role.ADMIN : Role.CUSTOMER,
    },
    include: { riderProfile: true },
  });

  return user;
}
