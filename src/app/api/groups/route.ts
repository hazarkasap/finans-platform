import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { createGroupSchema } from "@/lib/api-schemas";
import { jsonError, jsonFromZod, jsonOk } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const groups = await prisma.group.findMany({
    where: { memberships: { some: { userId: user!.id } } },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
      _count: { select: { expenses: true, settlements: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return jsonOk({ groups });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Geçersiz JSON gövdesi", 400);
  }

  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) return jsonFromZod(parsed.error);

  const { name, defaultCurrency, memberIds = [] } = parsed.data;
  const uniqueMemberIds = [...new Set([user!.id, ...memberIds])];

  const group = await prisma.group.create({
    data: {
      name,
      defaultCurrency,
      createdById: user!.id,
      memberships: {
        create: uniqueMemberIds.map((userId) => ({
          userId,
          role: userId === user!.id ? "OWNER" : "MEMBER",
        })),
      },
    },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
    },
  });

  return jsonOk({ group }, 201);
}
