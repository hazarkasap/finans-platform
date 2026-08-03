import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { jsonForbidden, jsonNotFound, jsonOk } from "@/lib/api-response";
import { requireGroupMember } from "@/lib/group-access";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string; expenseId: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { id: groupId, expenseId } = await context.params;
  const access = await requireGroupMember(user!.id, groupId);
  if (access.error) return access.error;

  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, groupId },
  });
  if (!expense) return jsonNotFound("Gider bulunamadı");

  const isOwner = access.membership!.role === "OWNER";
  const isCreator = expense.paidByUserId === user!.id;
  if (!isOwner && !isCreator) {
    return jsonForbidden("Bu gideri silme yetkiniz yok");
  }

  await prisma.expense.delete({ where: { id: expenseId } });

  return jsonOk({ deleted: true });
}
