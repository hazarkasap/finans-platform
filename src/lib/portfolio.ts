import {
  computePairwiseBalances,
  expenseToDebtInput,
  getNetBetweenUsers,
  roundMoney,
  type ExpenseInput,
  type SettlementInput,
} from "@/lib/debt";
import { decimalToNumber } from "@/lib/prisma-utils";
import { prisma } from "@/lib/db";

export type PortfolioUser = {
  id: string;
  email: string;
  displayName: string | null;
};

export type PortfolioGroupBreakdown = {
  groupId: string;
  groupName: string;
  amount: number;
};

export type PortfolioContact = {
  user: PortfolioUser;
  netAmount: number;
  byGroup: PortfolioGroupBreakdown[];
};

export type PersonalPortfolio = {
  summary: {
    totalOwedToYou: number;
    totalYouOwe: number;
    netPosition: number;
  };
  owedToYou: PortfolioContact[];
  youOwe: PortfolioContact[];
};

type GroupBundle = {
  groupId: string;
  groupName: string;
  memberIds: string[];
  expenses: ExpenseInput[];
  settlements: SettlementInput[];
  usersById: Map<string, PortfolioUser>;
};

function buildGroupBundles(
  userId: string,
  groups: { id: string; name: string }[],
  expenses: Awaited<ReturnType<typeof loadPortfolioData>>["expenses"],
  settlements: Awaited<ReturnType<typeof loadPortfolioData>>["settlements"],
  memberships: Awaited<ReturnType<typeof loadPortfolioData>>["memberships"],
): GroupBundle[] {
  const groupMap = new Map<string, GroupBundle>();

  for (const group of groups) {
    groupMap.set(group.id, {
      groupId: group.id,
      groupName: group.name,
      memberIds: [],
      expenses: [],
      settlements: [],
      usersById: new Map(),
    });
  }

  for (const membership of memberships) {
    const bundle = groupMap.get(membership.groupId);
    if (!bundle) continue;
    bundle.memberIds.push(membership.userId);
    bundle.usersById.set(membership.userId, membership.user);
  }

  for (const expense of expenses) {
    const bundle = groupMap.get(expense.groupId);
    if (!bundle) continue;

    const totalAmount = decimalToNumber(expense.totalAmount);
    const payments =
      expense.payments.length > 0 ?
        expense.payments.map((payment) => ({
          userId: payment.userId,
          paidAmount: decimalToNumber(payment.paidAmount),
        }))
      : undefined;

    bundle.expenses.push(
      expenseToDebtInput({
        paidByUserId: expense.paidByUserId,
        totalAmount,
        payments,
        splits: expense.splits.map((split) => ({
          userId: split.userId,
          owedAmount: decimalToNumber(split.owedAmount),
        })),
      }),
    );
  }

  for (const settlement of settlements) {
    const bundle = groupMap.get(settlement.groupId);
    if (!bundle) continue;
    bundle.settlements.push({
      fromUserId: settlement.fromUserId,
      toUserId: settlement.toUserId,
      amount: decimalToNumber(settlement.amount),
    });
  }

  return [...groupMap.values()].filter((bundle) =>
    bundle.memberIds.includes(userId),
  );
}

async function loadPortfolioData(userId: string) {
  const groups = await prisma.group.findMany({
    where: { memberships: { some: { userId } } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (groups.length === 0) {
    return {
      groups,
      expenses: [],
      settlements: [],
      memberships: [],
    };
  }

  const groupIds = groups.map((group) => group.id);

  const [expenses, settlements, memberships] = await Promise.all([
    prisma.expense.findMany({
      where: { groupId: { in: groupIds } },
      include: { splits: true, payments: true },
    }),
    prisma.settlement.findMany({
      where: { groupId: { in: groupIds } },
    }),
    prisma.membership.findMany({
      where: { groupId: { in: groupIds } },
      include: {
        user: {
          select: { id: true, email: true, displayName: true },
        },
      },
    }),
  ]);

  return { groups, expenses, settlements, memberships };
}

export async function getPersonalPortfolio(
  userId: string,
): Promise<PersonalPortfolio> {
  const { groups, expenses, settlements, memberships } =
    await loadPortfolioData(userId);

  const bundles = buildGroupBundles(
    userId,
    groups,
    expenses,
    settlements,
    memberships,
  );

  const contactMap = new Map<
    string,
    {
      user: PortfolioUser;
      netAmount: number;
      byGroup: PortfolioGroupBreakdown[];
    }
  >();

  for (const bundle of bundles) {
    const pairwise = computePairwiseBalances(
      bundle.memberIds,
      bundle.expenses,
      bundle.settlements,
    );

    for (const memberId of bundle.memberIds) {
      if (memberId === userId) continue;

      const amount = getNetBetweenUsers(pairwise, userId, memberId);
      if (Math.abs(amount) <= 0.01) continue;

      const user = bundle.usersById.get(memberId);
      if (!user) continue;

      const existing = contactMap.get(memberId);
      if (existing) {
        existing.netAmount = roundMoney(existing.netAmount + amount);
        existing.byGroup.push({
          groupId: bundle.groupId,
          groupName: bundle.groupName,
          amount,
        });
      } else {
        contactMap.set(memberId, {
          user,
          netAmount: amount,
          byGroup: [
            {
              groupId: bundle.groupId,
              groupName: bundle.groupName,
              amount,
            },
          ],
        });
      }
    }
  }

  const contacts = [...contactMap.values()].map((contact) => ({
    ...contact,
    netAmount: roundMoney(contact.netAmount),
    byGroup: contact.byGroup.filter((entry) => Math.abs(entry.amount) > 0.01),
  }));

  let totalOwedToYou = 0;
  let totalYouOwe = 0;

  for (const contact of contacts) {
    if (contact.netAmount > 0) {
      totalOwedToYou = roundMoney(totalOwedToYou + contact.netAmount);
    } else if (contact.netAmount < 0) {
      totalYouOwe = roundMoney(totalYouOwe + Math.abs(contact.netAmount));
    }
  }

  const owedToYou = contacts
    .filter((contact) => contact.netAmount > 0.01)
    .sort((a, b) => b.netAmount - a.netAmount);

  const youOwe = contacts
    .filter((contact) => contact.netAmount < -0.01)
    .sort((a, b) => a.netAmount - b.netAmount);

  return {
    summary: {
      totalOwedToYou,
      totalYouOwe,
      netPosition: roundMoney(totalOwedToYou - totalYouOwe),
    },
    owedToYou,
    youOwe,
  };
}
