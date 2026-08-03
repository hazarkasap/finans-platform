import type { NextRequest } from "next/server";

import { requireUser } from "@/lib/api-auth";
import { jsonOk } from "@/lib/api-response";
import { computeGroupDebts, expenseToDebtInput } from "@/lib/debt";
import { getGroupMemberIds, requireGroupMember } from "@/lib/group-access";
import { decimalToNumber } from "@/lib/prisma-utils";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { user, error } = await requireUser(request);
  if (error) return error;

  const { id: groupId } = await context.params;
  const access = await requireGroupMember(user!.id, groupId);
  if (access.error) return access.error;

  const memberIds = await getGroupMemberIds(groupId);

  const [expenses, settlements, members] = await Promise.all([
    prisma.expense.findMany({
      where: { groupId },
      include: { splits: true, payments: true },
    }),
    prisma.settlement.findMany({ where: { groupId } }),
    prisma.user.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, email: true, displayName: true },
    }),
  ]);

  const expenseInputs = expenses.map((e) => {
    const totalAmount = decimalToNumber(e.totalAmount);
    const payments =
      e.payments.length > 0 ?
        e.payments.map((p) => ({
          userId: p.userId,
          paidAmount: decimalToNumber(p.paidAmount),
        }))
      : undefined;

    return expenseToDebtInput({
      paidByUserId: e.paidByUserId,
      totalAmount,
      payments,
      splits: e.splits.map((s) => ({
        userId: s.userId,
        owedAmount: decimalToNumber(s.owedAmount),
      })),
    });
  });

  const settlementInputs = settlements.map((s) => ({
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    amount: decimalToNumber(s.amount),
  }));

  const { netBalances, suggestedTransfers } = computeGroupDebts(
    memberIds,
    expenseInputs,
    settlementInputs,
  );

  const netBalancesRecord: Record<string, number> = {};
  for (const [userId, amount] of netBalances) {
    netBalancesRecord[userId] = amount;
  }

  return jsonOk({
    groupId,
    members,
    netBalances: netBalancesRecord,
    suggestedTransfers,
    allSettled: suggestedTransfers.length === 0,
  });
}
