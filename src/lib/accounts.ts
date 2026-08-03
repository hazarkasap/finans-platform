import type { Transaction, TransactionType } from "@prisma/client";

import { decimalToNumber } from "@/lib/prisma-utils";

export function computeAccountBalance(
  initialBalance: number | Parameters<typeof decimalToNumber>[0],
  transactions: Pick<Transaction, "amount" | "type">[],
): number {
  let balance =
    typeof initialBalance === "number"
      ? initialBalance
      : decimalToNumber(initialBalance);

  for (const tx of transactions) {
    const amount = decimalToNumber(tx.amount);
    balance += signedTransactionAmount(amount, tx.type);
  }

  return Math.round(balance * 100) / 100;
}

function signedTransactionAmount(
  amount: number,
  type: TransactionType,
): number {
  switch (type) {
    case "INCOME":
      return amount;
    case "EXPENSE":
      return -amount;
    case "TRANSFER":
      return -amount;
    default:
      return 0;
  }
}
