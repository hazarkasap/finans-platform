import { BillsPanel, type BillItem } from "@/components/bills/bills-panel";
import type { AccountOption } from "@/components/bills/bill-pay-controls";
import { decimalToNumber } from "@/lib/prisma-utils";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";

export default async function BillsPage() {
  const user = await requireSessionUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [bills, accounts] = await Promise.all([
    prisma.bill.findMany({
      where: { userId: user.id },
      orderBy: { dueDate: "asc" },
      include: {
        linkedTransaction: {
          include: {
            account: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.personalAccount.findMany({
      where: { userId: user.id, archivedAt: null },
      select: { id: true, name: true, type: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const initialBills: BillItem[] = bills.map((bill) => ({
    id: bill.id,
    title: bill.title,
    amount: decimalToNumber(bill.amount),
    dueDate: bill.dueDate.toISOString(),
    status: bill.status,
    isOverdue: bill.status === "PENDING" && bill.dueDate < today,
    paidAccount: bill.linkedTransaction?.account ?? null,
  }));

  const accountOptions: AccountOption[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
  }));

  return (
    <BillsPanel initialBills={initialBills} accounts={accountOptions} />
  );
}
