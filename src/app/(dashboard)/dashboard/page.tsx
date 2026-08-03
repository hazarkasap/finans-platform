import Link from "next/link";

import { DashboardCharts } from "@/components/charts/dashboard-charts";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { computeAccountBalance } from "@/lib/accounts";
import {
  aggregateMonthlyCashflow,
  buildAccountBalanceSlices,
  buildBillStatusSlices,
} from "@/lib/dashboard-stats";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { getPersonalPortfolio } from "@/lib/portfolio";
import { decimalToNumber } from "@/lib/prisma-utils";
import { requireSessionUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireSessionUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [groups, accounts, overdueBills, pendingBillsCount, allBills, portfolio] =
    await Promise.all([
      prisma.group.findMany({
        where: { memberships: { some: { userId: user.id } } },
        select: { id: true, name: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.personalAccount.findMany({
        where: { userId: user.id, archivedAt: null },
        include: { transactions: true },
      }),
      prisma.bill.findMany({
        where: {
          userId: user.id,
          status: "PENDING",
          dueDate: { lt: today },
        },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.bill.count({
        where: { userId: user.id, status: "PENDING" },
      }),
      prisma.bill.findMany({
        where: { userId: user.id },
        select: { status: true, amount: true, dueDate: true },
      }),
      getPersonalPortfolio(user.id),
    ]);

  const totalBalance = accounts.reduce((sum, account) => {
    return (
      sum +
      computeAccountBalance(
        decimalToNumber(account.initialBalance),
        account.transactions,
      )
    );
  }, 0);

  const allTransactions = accounts.flatMap((account) => account.transactions);

  const chartData = {
    accountSlices: buildAccountBalanceSlices(accounts),
    portfolio: {
      alacak: portfolio.summary.totalOwedToYou,
      borc: portfolio.summary.totalYouOwe,
      net: portfolio.summary.netPosition,
    },
    cashflow: aggregateMonthlyCashflow(allTransactions),
    billSlices: buildBillStatusSlices(allBills, today),
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Özet"
        description={`Hoş geldiniz, ${user.displayName ?? user.email}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam kişisel bakiye</CardDescription>
            <CardTitle className="text-2xl">
              <Money amount={totalBalance} showSign />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/accounts">Hesaplara git</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Kişisel portföy</CardDescription>
            <CardTitle className="text-2xl">
              <Money amount={portfolio.summary.netPosition} showSign />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-[var(--muted-foreground)]">
              Alacak: {portfolio.summary.totalOwedToYou.toLocaleString("tr-TR")}{" "}
              ₺ · Borç: {portfolio.summary.totalYouOwe.toLocaleString("tr-TR")} ₺
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/portfolio">Portföye git</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gruplarınız</CardDescription>
            <CardTitle className="text-2xl">{groups.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link href="/groups">Grupları gör</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Bekleyen faturalar</CardDescription>
            <CardTitle className="text-2xl">{pendingBillsCount}</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueBills.length > 0 ?
              <Badge variant="danger">{overdueBills.length} gecikmiş</Badge>
            : <span className="text-sm text-[var(--muted-foreground)]">Gecikmiş yok</span>}
          </CardContent>
        </Card>
      </div>

      <DashboardCharts {...chartData} />

      {overdueBills.length > 0 ?
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gecikmiş faturalar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {overdueBills.map((bill) => (
                <li
                  key={bill.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{bill.title}</span>
                  <span className="flex items-center gap-2">
                    <Money amount={decimalToNumber(bill.amount)} />
                    <span className="text-[var(--muted-foreground)]">
                      {formatDate(bill.dueDate)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Button className="mt-4" variant="outline" size="sm" asChild>
              <Link href="/bills">Tüm faturalar</Link>
            </Button>
          </CardContent>
        </Card>
      : null}

      {groups.length > 0 ?
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Son gruplar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {groups.map((group) => (
                <li key={group.id}>
                  <Link
                    href={`/groups/${group.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {group.name}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      : null}
    </div>
  );
}
