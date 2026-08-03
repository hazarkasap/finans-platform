import { AccountsPanel } from "@/components/accounts/accounts-panel";
import { computeAccountBalance } from "@/lib/accounts";
import { decimalToNumber } from "@/lib/prisma-utils";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";

export default async function AccountsPage() {
  const user = await requireSessionUser();

  const accounts = await prisma.personalAccount.findMany({
    where: { userId: user.id, archivedAt: null },
    include: { transactions: true },
    orderBy: { createdAt: "desc" },
  });

  const initialAccounts = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    currency: account.currency,
    initialBalance: decimalToNumber(account.initialBalance),
    balance: computeAccountBalance(
      decimalToNumber(account.initialBalance),
      account.transactions,
    ),
  }));

  return <AccountsPanel initialAccounts={initialAccounts} />;
}
