import Link from "next/link";

import { PortfolioCharts } from "@/components/charts/portfolio-charts";
import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollTable } from "@/components/scroll-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { userLabel } from "@/lib/format";
import type { PortfolioContact } from "@/lib/portfolio";
import { formatTry } from "@/lib/utils";

function ContactCard({
  contact,
  variant,
}: {
  contact: PortfolioContact;
  variant: "owed" | "owe";
}) {
  const amount = Math.abs(contact.netAmount);

  return (
    <li className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-3">
        <ContactHeader contact={contact} variant={variant} />
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Money amount={amount} />
          <Badge variant={variant === "owed" ? "success" : "danger"}>
            {variant === "owed" ? "alacağın" : "borcun"}
          </Badge>
        </div>
      </div>
      {contact.byGroup.length > 1 ?
        <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {contact.byGroup.map((entry) => (
            <li
              key={`${contact.user.id}-${entry.groupId}`}
              className="flex items-center justify-between text-xs text-zinc-500"
            >
              <Link
                href={`/groups/${entry.groupId}`}
                className="truncate hover:underline"
              >
                {entry.groupName}
              </Link>
              <Money amount={Math.abs(entry.amount)} className="inline" />
            </li>
          ))}
        </ul>
      : contact.byGroup.length === 1 ?
        <p className="mt-2 text-xs text-zinc-500">
          <Link
            href={`/groups/${contact.byGroup[0].groupId}`}
            className="hover:underline"
          >
            {contact.byGroup[0].groupName}
          </Link>
        </p>
      : null}
    </li>
  );
}

function ContactHeader({
  contact,
  variant,
}: {
  contact: PortfolioContact;
  variant: "owed" | "owe";
}) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium">{userLabel(contact.user)}</p>
      <p className="truncate text-xs text-zinc-500">{contact.user.email}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {variant === "owed" ?
          "Bu kişi size borçlu"
        : "Bu kişiye borçlusunuz"}
      </p>
    </div>
  );
}

function ContactTable({
  contacts,
  variant,
}: {
  contacts: PortfolioContact[];
  variant: "owed" | "owe";
}) {
  return (
    <ScrollTable className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kişi</TableHead>
            <TableHead>Gruplar</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.user.id}>
              <TableCell>
                <p className="font-medium">{userLabel(contact.user)}</p>
                <p className="text-xs text-zinc-500">{contact.user.email}</p>
              </TableCell>
              <TableCell className="text-xs text-zinc-500">
                {contact.byGroup.map((entry, index) => (
                  <span key={entry.groupId}>
                    {index > 0 ? ", " : ""}
                    <Link
                      href={`/groups/${entry.groupId}`}
                      className="hover:underline"
                    >
                      {entry.groupName}
                    </Link>
                  </span>
                ))}
              </TableCell>
              <TableCell className="text-right">
                <Money amount={Math.abs(contact.netAmount)} />
                <Badge
                  variant={variant === "owed" ? "success" : "danger"}
                  className="ml-2"
                >
                  {variant === "owed" ? "alacağın" : "borcun"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollTable>
  );
}

export function PersonalPortfolioView({
  portfolio,
}: {
  portfolio: {
    summary: {
      totalOwedToYou: number;
      totalYouOwe: number;
      netPosition: number;
    };
    owedToYou: PortfolioContact[];
    youOwe: PortfolioContact[];
  };
}) {
  const hasContacts =
    portfolio.owedToYou.length > 0 || portfolio.youOwe.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam alacağın</CardDescription>
            <CardTitle className="text-2xl text-emerald-600 dark:text-emerald-400">
              {formatTry(portfolio.summary.totalOwedToYou)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Toplam borcun</CardDescription>
            <CardTitle className="text-2xl text-red-600 dark:text-red-400">
              {formatTry(portfolio.summary.totalYouOwe)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net pozisyon</CardDescription>
            <CardTitle className="text-2xl">
              <Money amount={portfolio.summary.netPosition} showSign />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-zinc-500">
              Tüm gruplardaki borç ve alacakların özeti
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <PageHeader
          title="Grafikler"
          description="Alacak, borç ve grup dağılımı"
        />
        <PortfolioCharts
          summary={portfolio.summary}
          owedToYou={portfolio.owedToYou}
          youOwe={portfolio.youOwe}
        />
      </section>

      {!hasContacts ?
        <EmptyState title="Aktif borç veya alacak yok" />
      : <>
          {portfolio.owedToYou.length > 0 ?
            <section className="space-y-3">
              <PageHeader
                title="Sana borçlular"
                description="Gruplardaki paylaşımlardan size borcu olan kişiler"
              />
              <ul className="space-y-3 md:hidden">
                {portfolio.owedToYou.map((contact) => (
                  <ContactCard
                    key={contact.user.id}
                    contact={contact}
                    variant="owed"
                  />
                ))}
              </ul>
              <ContactTable contacts={portfolio.owedToYou} variant="owed" />
            </section>
          : null}

          {portfolio.youOwe.length > 0 ?
            <section className="space-y-3">
              <PageHeader
                title="Borçlu oldukların"
                description="Gruplardaki paylaşımlardan borçlu olduğunuz kişiler"
              />
              <ul className="space-y-3 md:hidden">
                {portfolio.youOwe.map((contact) => (
                  <ContactCard
                    key={contact.user.id}
                    contact={contact}
                    variant="owe"
                  />
                ))}
              </ul>
              <ContactTable contacts={portfolio.youOwe} variant="owe" />
            </section>
          : null}
        </>
      }
    </div>
  );
}
