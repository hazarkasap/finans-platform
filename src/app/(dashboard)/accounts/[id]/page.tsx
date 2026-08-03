import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountDetail } from "@/components/accounts/account-detail";
import { Button } from "@/components/ui/button";
import { computeAccountBalance } from "@/lib/accounts";
import { decimalToNumber } from "@/lib/prisma-utils";
import { prisma } from "@/lib/db";
import { requireSessionUser } from "@/lib/session";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AccountDetailPage({ params }: PageProps) {
  const user = await requireSessionUser();
  const { id } = await params;

  const account = await prisma.personalAccount.findFirst({
    where: { id, userId: user.id, archivedAt: null },
    include: { transactions: true },
  });

  if (!account) notFound();

  const balance = computeAccountBalance(
    decimalToNumber(account.initialBalance),
    account.transactions,
  );

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
        <Link href="/accounts">← Hesaplar</Link>
      </Button>
      <AccountDetail accountId={id} initialBalance={balance} />
    </div>
  );
}
