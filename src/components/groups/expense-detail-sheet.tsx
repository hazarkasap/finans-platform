"use client";

import { ExpenseBadges } from "@/components/expense-badges";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, userLabel } from "@/lib/format";

type Member = {
  id: string;
  email: string;
  displayName: string | null;
};

export type ExpenseDetail = {
  id: string;
  totalAmount: string | number;
  date: string;
  description: string | null;
  category: string;
  splitType: string;
  paidBy: Member;
  payments?: { paidAmount: string | number; user: Member }[];
  splits?: { owedAmount: string | number; user: Member }[];
};

export function ExpenseDetailSheet({
  expense,
  open,
  onOpenChange,
  onDelete,
}: {
  expense: ExpenseDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
}) {
  if (!expense) return null;

  const payments =
    expense.payments && expense.payments.length > 0 ?
      expense.payments
    : [{ paidAmount: expense.totalAmount, user: expense.paidBy }];

  const splits = expense.splits ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title="Gider detayı">
        <div className="space-y-6">
          <div>
            <p className="text-xl font-semibold">
              {expense.description ?? "Gider"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">{formatDate(expense.date)}</p>
            <ExpenseBadges
              className="mt-3"
              category={expense.category}
              splitType={expense.splitType}
              multiPayer={(expense.payments?.length ?? 0) > 1}
            />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Toplam tutar
            </p>
            <p className="mt-1 text-2xl font-semibold">
              <Money amount={Number(expense.totalAmount)} />
            </p>
          </div>

          <section>
            <h3 className="mb-2 text-sm font-medium">Ödemeler</h3>
            <p className="mb-3 text-xs text-zinc-500">
              Bu gideri kim ne kadar ödedi
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Üye</TableHead>
                  <TableHead className="text-right">Ödenen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p, i) => (
                  <TableRow key={`${p.user.id}-${i}`}>
                    <TableCell>{userLabel(p.user)}</TableCell>
                    <TableCell className="text-right">
                      <Money amount={Number(p.paidAmount)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {splits.length > 0 ? (
            <>
              <Separator />
              <section>
                <h3 className="mb-2 text-sm font-medium">Paylaşım</h3>
                <p className="mb-3 text-xs text-zinc-500">
                  Her üyenin payı (borç dağılımı)
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Üye</TableHead>
                      <TableHead className="text-right">Pay</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {splits.map((s) => (
                      <TableRow key={s.user.id}>
                        <TableCell>{userLabel(s.user)}</TableCell>
                        <TableCell className="text-right">
                          <Money amount={Number(s.owedAmount)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </section>
            </>
          ) : null}

          {onDelete ? (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 dark:text-red-400"
                onClick={() => {
                  onDelete(expense.id);
                  onOpenChange(false);
                }}
              >
                Gideri sil
              </Button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
