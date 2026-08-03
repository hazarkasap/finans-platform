import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { createSettlementSchema } from "@/lib/api-schemas";
import { jsonError, jsonFromZod, jsonOk } from "@/lib/api-response";
import { getGroupMemberIds, requireGroupMember } from "@/lib/group-access";
import { parseDateInput } from "@/lib/prisma-utils";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { id: groupId } = await context.params;
  const access = await requireGroupMember(user!.id, groupId);
  if (access.error) return access.error;

  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    include: {
      fromUser: { select: { id: true, email: true, displayName: true } },
      toUser: { select: { id: true, email: true, displayName: true } },
    },
    orderBy: { date: "desc" },
  });

  return jsonOk({ settlements });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { id: groupId } = await context.params;
  const access = await requireGroupMember(user!.id, groupId);
  if (access.error) return access.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Geçersiz JSON gövdesi", 400);
  }

  const parsed = createSettlementSchema.safeParse(body);
  if (!parsed.success) return jsonFromZod(parsed.error);

  const { fromUserId, toUserId, amount, date, currency, note } = parsed.data;

  if (fromUserId === toUserId) {
    return jsonError("Gönderen ve alıcı farklı olmalı", 400);
  }

  const memberIds = await getGroupMemberIds(groupId);
  if (!memberIds.includes(fromUserId) || !memberIds.includes(toUserId)) {
    return jsonError("Her iki kullanıcı da grup üyesi olmalı", 400);
  }

  let settlementDate: Date;
  try {
    settlementDate = parseDateInput(date);
  } catch {
    return jsonError("Geçersiz tarih", 400);
  }

  const settlement = await prisma.settlement.create({
    data: {
      groupId,
      fromUserId,
      toUserId,
      amount,
      currency,
      date: settlementDate,
      note,
    },
    include: {
      fromUser: { select: { id: true, email: true, displayName: true } },
      toUser: { select: { id: true, email: true, displayName: true } },
    },
  });

  return jsonOk({ settlement }, 201);
}
