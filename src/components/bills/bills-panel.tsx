"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BillPayControls, type AccountOption } from "@/components/bills/bill-pay-controls";
import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { ScrollTable } from "@/components/scroll-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError, apiFetch } from "@/lib/api-client";
import { formatDate, todayIsoDate } from "@/lib/format";

export type BillItem = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  isOverdue: boolean;
  paidAccount?: { id: string; name: string } | null;
};

export function BillsPanel({
  initialBills,
  accounts,
}: {
  initialBills: BillItem[];
  accounts: AccountOption[];
}) {
  const router = useRouter();
  const [bills, setBills] = useState(initialBills);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(todayIsoDate());
  const [error, setError] = useState<string | null>(null);

  const defaultAccountId = accounts[0]?.id ?? "";

  const pending = bills.filter((b) => b.status === "PENDING");
  const paid = bills.filter((b) => b.status === "PAID");

  async function createBill(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { bill } = await apiFetch<{
        bill: {
          id: string;
          title: string;
          amount: string | number;
          dueDate: string;
          status: BillItem["status"];
        };
      }>("/api/bills", {
        method: "POST",
        body: JSON.stringify({
          title,
          amount: Number(amount),
          dueDate,
        }),
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(bill.dueDate);
      const isOverdue = bill.status === "PENDING" && due < today;

      setBills((prev) => [
        {
          id: bill.id,
          title: bill.title,
          amount: Number(bill.amount),
          dueDate: bill.dueDate,
          status: bill.status,
          isOverdue,
        },
        ...prev,
      ]);
      setTitle("");
      setAmount("");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Fatura eklenemedi");
    }
  }

  async function markPaid(billId: string, accountId: string) {
    try {
      const { bill } = await apiFetch<{
        bill: {
          status: BillItem["status"];
          linkedTransaction?: {
            account: { id: string; name: string };
          } | null;
        };
      }>(`/api/bills/${billId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "PAID", accountId }),
      });

      const paidAccount = bill.linkedTransaction?.account ?? null;

      setBills((prev) =>
        prev.map((b) =>
          b.id === billId ?
            {
              ...b,
              status: "PAID" as const,
              isOverdue: false,
              paidAccount,
            }
          : b,
        ),
      );
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Güncellenemedi");
      throw err;
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Faturalar"
        description="Vade takibi; ödeme yapınca seçtiğiniz hesaba gider kaydı düşer"
        action={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto"
          >
            {showForm ? "İptal" : "Yeni fatura"}
          </Button>
        }
      />

      {accounts.length === 0 ?
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          Fatura ödemelerini hesaba işlemek için önce{" "}
          <Link href="/accounts" className="font-medium underline">
            bir hesap ekleyin
          </Link>
          .
        </p>
      : null}

      {showForm ?
        <form
          onSubmit={createBill}
          className="max-w-md space-y-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
        >
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="space-y-2">
            <Label htmlFor="billTitle">Başlık</Label>
            <Input
              id="billTitle"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kira"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billAmount">Tutar</Label>
            <Input
              id="billAmount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billDue">Vade</Label>
            <Input
              id="billDue"
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Kaydet
          </Button>
        </form>
      : null}

      {pending.length === 0 && paid.length === 0 ?
        <EmptyState title="Henüz fatura yok" />
      : <>
          {pending.length > 0 ?
            <section>
              <h2 className="mb-3 text-lg font-semibold">Bekleyen</h2>
              <ul className="space-y-2 md:hidden">
                {pending.map((bill) => (
                  <li
                    key={bill.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{bill.title}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Vade: {formatDate(bill.dueDate)}
                        </p>
                        {bill.isOverdue ?
                          <Badge variant="danger" className="mt-1">
                            gecikmiş
                          </Badge>
                        : null}
                      </div>
                      <Money amount={bill.amount} className="shrink-0" />
                    </div>
                    <BillPayControls
                      billId={bill.id}
                      accounts={accounts}
                      defaultAccountId={defaultAccountId}
                      onPay={markPaid}
                      compact
                    />
                  </li>
                ))}
              </ul>
              <ScrollTable className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Vade</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead>Ödeme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>
                          {bill.title}
                          {bill.isOverdue ?
                            <Badge variant="danger" className="ml-2">
                              gecikmiş
                            </Badge>
                          : null}
                        </TableCell>
                        <TableCell>{formatDate(bill.dueDate)}</TableCell>
                        <TableCell className="text-right">
                          <Money amount={bill.amount} />
                        </TableCell>
                        <TableCell>
                          <BillPayControls
                            billId={bill.id}
                            accounts={accounts}
                            defaultAccountId={defaultAccountId}
                            onPay={markPaid}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollTable>
            </section>
          : null}

          {paid.length > 0 ?
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[var(--muted-foreground)]">
                Ödenen
              </h2>
              <ul className="space-y-2 md:hidden">
                {paid.map((bill) => (
                  <li
                    key={bill.id}
                    className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 opacity-80"
                  >
                    <p className="font-medium">{bill.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatDate(bill.dueDate)}
                    </p>
                    {bill.paidAccount ?
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Ödenen hesap:{" "}
                        <Link
                          href={`/accounts/${bill.paidAccount.id}`}
                          className="font-medium text-[var(--foreground)] hover:underline"
                        >
                          {bill.paidAccount.name}
                        </Link>
                      </p>
                    : null}
                    <Money amount={bill.amount} className="mt-1" />
                  </li>
                ))}
              </ul>
              <ScrollTable className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Başlık</TableHead>
                      <TableHead>Vade</TableHead>
                      <TableHead>Ödenen hesap</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paid.map((bill) => (
                      <TableRow key={bill.id} className="opacity-80">
                        <TableCell>{bill.title}</TableCell>
                        <TableCell>{formatDate(bill.dueDate)}</TableCell>
                        <TableCell>
                          {bill.paidAccount ?
                            <Link
                              href={`/accounts/${bill.paidAccount.id}`}
                              className="text-sm hover:underline"
                            >
                              {bill.paidAccount.name}
                            </Link>
                          : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Money amount={bill.amount} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollTable>
            </section>
          : null}
        </>
      }
    </div>
  );
}
