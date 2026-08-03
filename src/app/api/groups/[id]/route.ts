import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { updateGroupSchema } from "@/lib/api-schemas";
import { jsonError, jsonFromZod, jsonForbidden, jsonOk } from "@/lib/api-response";
import { requireGroupMember } from "@/lib/group-access";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { id: groupId } = await context.params;
  const access = await requireGroupMember(user!.id, groupId);
  if (access.error) return access.error;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
      _count: { select: { expenses: true, settlements: true } },
    },
  });

  return jsonOk({ group });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { id: groupId } = await context.params;
  const access = await requireGroupMember(user!.id, groupId);
  if (access.error) return access.error;

  if (access.membership!.role !== "OWNER") {
    return jsonForbidden("Yalnızca grup sahibi adı değiştirebilir");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Geçersiz JSON gövdesi", 400);
  }

  const parsed = updateGroupSchema.safeParse(body);
  if (!parsed.success) return jsonFromZod(parsed.error);

  const group = await prisma.group.update({
    where: { id: groupId },
    data: { name: parsed.data.name },
    include: {
      memberships: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
    },
  });

  return jsonOk({ group });
}
