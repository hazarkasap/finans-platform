import type { Transaction } from "@prisma/client";

import { computeAccountBalance } from "@/lib/accounts";
import { CHART_ACCOUNT_COLORS, CHART_BILL_COLORS } from "@/lib/chart-colors";
import { decimalToNumber } from "@/lib/prisma-utils";

export type AccountBalanceSlice = {
  name: string;
  balance: number;
  color: string;
};

export type MonthlyCashflow = {
  label: string;
  income: number;
  expense: number;
};

export type BillStatusSlice = {
  name: string;
  value: number;
  color: string;
};

export function buildAccountBalanceSlices(
  accounts: {
    name: string;
    initialBalance: Parameters<typeof decimalToNumber>[0];
    transactions: Pick<Transaction, "amount" | "type">[];
  }[],
): AccountBalanceSlice[] {
  return accounts
    .map((account, index) => ({
      name: account.name,
      balance: computeAccountBalance(
        decimalToNumber(account.initialBalance),
        account.transactions,
      ),
      color: CHART_ACCOUNT_COLORS[index % CHART_ACCOUNT_COLORS.length],
    }))
    .filter((row) => Math.abs(row.balance) > 0.01);
}

export function aggregateMonthlyCashflow(
  transactions: Pick<Transaction, "date" | "amount" | "type">[],
  months = 6,
): MonthlyCashflow[] {
  const now = new Date();
  const buckets = new Map<string, { income: number; expense: number }>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, { income: 0, expense: 0 });
  }

  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.get(key);
    if (!bucket) continue;

    const amount = decimalToNumber(tx.amount);
    if (tx.type === "INCOME") {
      bucket.income += amount;
    } else if (tx.type === "EXPENSE") {
      bucket.expense += amount;
    }
  }

  return [...buckets.entries()].map(([monthKey, data]) => {
    const [year, month] = monthKey.split("-");
    const label = new Intl.DateTimeFormat("tr-TR", {
      month: "short",
      year: "numeric",
    }).format(new Date(Number(year), Number(month) - 1, 1));
    return {
      label,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
    };
  });
}

export function buildBillStatusSlices(
  bills: { status: string; amount: Parameters<typeof decimalToNumber>[0]; dueDate: Date }[],
  today: Date,
): BillStatusSlice[] {
  let pending = 0;
  let overdue = 0;
  let paid = 0;

  for (const bill of bills) {
    const amount = decimalToNumber(bill.amount);
    if (bill.status === "PAID") {
      paid += amount;
    } else if (bill.status === "PENDING" && bill.dueDate < today) {
      overdue += amount;
    } else if (bill.status === "PENDING" || bill.status === "OVERDUE") {
      pending += amount;
    }
  }

  return [
    { name: "Bekleyen", value: pending, color: CHART_BILL_COLORS.pending },
    { name: "Gecikmiş", value: overdue, color: CHART_BILL_COLORS.overdue },
    { name: "Ödenen", value: paid, color: CHART_BILL_COLORS.paid },
  ].filter((row) => row.value > 0.01);
}
