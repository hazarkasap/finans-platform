import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { createExpenseSchema } from "@/lib/api-schemas";
import { jsonError, jsonFromZod, jsonOk } from "@/lib/api-response";
import {
  buildExpenseSplits,
  DebtValidationError,
  normalizePayments,
  primaryPayerUserId,
} from "@/lib/debt";
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

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      paidBy: { select: { id: true, email: true, displayName: true } },
      payments: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
      splits: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  return jsonOk({ expenses });
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

  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) return jsonFromZod(parsed.error);

  const {
    totalAmount,
    paidByUserId,
    description,
    date,
    currency,
    category,
    splitType,
    participantIds,
    splits: customSplits,
    percentages,
    shares,
    payments: rawPayments,
  } = parsed.data;

  const memberIds = await getGroupMemberIds(groupId);
  const participants =
    participantIds?.length ?
      participantIds.filter((id) => memberIds.includes(id))
    : memberIds;

  if (participants.length === 0) {
    return jsonError("Geçerli katılımcı bulunamadı", 400);
  }

  let normalizedPayments: { userId: string; paidAmount: number }[];
  let splitRows: { userId: string; owedAmount: number }[];

  try {
    normalizedPayments = normalizePayments(
      totalAmount,
      rawPayments,
      paidByUserId,
    );
    for (const p of normalizedPayments) {
      if (!memberIds.includes(p.userId)) {
        return jsonError("Ödeyen kullanıcı grup üyesi değil", 400);
      }
    }

    splitRows = buildExpenseSplits({
      splitType,
      totalAmount,
      participantIds: participants,
      splits: customSplits,
      percentages,
      shares,
    });

    for (const s of splitRows) {
      if (!memberIds.includes(s.userId)) {
        return jsonError("Tüm pay sahipleri grup üyesi olmalı", 400);
      }
    }
  } catch (err) {
    if (err instanceof DebtValidationError) {
      return jsonError(err.message, 400);
    }
    throw err;
  }

  const primaryPayer = primaryPayerUserId(normalizedPayments);

  let expenseDate: Date;
  try {
    expenseDate = parseDateInput(date);
  } catch {
    return jsonError("Geçersiz tarih", 400);
  }

  const expense = await prisma.expense.create({
    data: {
      groupId,
      paidByUserId: primaryPayer,
      totalAmount,
      currency,
      date: expenseDate,
      description,
      category,
      splitType,
      payments: {
        create: normalizedPayments.map((p) => ({
          userId: p.userId,
          paidAmount: p.paidAmount,
        })),
      },
      splits: {
        create: splitRows.map((s) => ({
          userId: s.userId,
          owedAmount: s.owedAmount,
        })),
      },
    },
    include: {
      paidBy: { select: { id: true, email: true, displayName: true } },
      payments: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
      splits: {
        include: {
          user: { select: { id: true, email: true, displayName: true } },
        },
      },
    },
  });

  return jsonOk({ expense }, 201);
}
