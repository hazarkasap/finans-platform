"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/money";
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
import { touchSelectClass } from "@/lib/ui-classes";
import { PageHeader } from "@/components/page-header";
import { ScrollTable } from "@/components/scroll-table";

type Transaction = {
  id: string;
  amount: string | number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  date: string;
  description: string | null;
};

type AccountData = {
  account: {
    id: string;
    name: string;
    type: string;
    currency: string;
    initialBalance: string | number;
  };
  transactions: Transaction[];
};

const typeLabels = {
  INCOME: "Gelir",
  EXPENSE: "Gider",
  TRANSFER: "Transfer",
};

export function AccountDetail({
  accountId,
  initialBalance,
}: {
  accountId: string;
  initialBalance: number;
}) {
  const router = useRouter();
  const [accountName, setAccountName] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(initialBalance);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    amount: "",
    type: "EXPENSE" as "INCOME" | "EXPENSE",
    date: todayIsoDate(),
    description: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<AccountData>(
        `/api/accounts/${accountId}/transactions`,
      );
      setAccountName(data.account.name);
      setTransactions(data.transactions);

      let bal = Number(data.account.initialBalance);
      for (const tx of data.transactions) {
        const amt = Number(tx.amount);
        if (tx.type === "INCOME") bal += amt;
        else bal -= amt;
      }
      setBalance(Math.round(bal * 100) / 100);
    } catch {
      setAccountName("Hesap");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch(`/api/accounts/${accountId}/transactions`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(form.amount),
          type: form.type,
          date: form.date,
          description: form.description || undefined,
        }),
      });
      setForm((f) => ({ ...f, amount: "", description: "" }));
      await load();
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "İşlem eklenemedi");
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={accountName}
        description={
          <>
            Bakiye: <Money amount={balance} showSign />
          </>
        }
      />

      <form
        onSubmit={addTransaction}
        className="grid gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <Label>Tutar</Label>
          <Input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Tür</Label>
          <select
            className={touchSelectClass}
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                type: e.target.value as "INCOME" | "EXPENSE",
              }))
            }
          >
            <option value="INCOME">Gelir</option>
            <option value="EXPENSE">Gider</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Tarih</Label>
          <Input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Açıklama</Label>
          <Input
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full sm:w-auto">
            İşlem ekle
          </Button>
        </div>
      </form>

      {transactions.length === 0 ? (
        <EmptyState title="Henüz işlem yok" />
      ) : (
        <>
          <ul className="space-y-2 md:hidden">
            {transactions.map((tx) => {
              const signed =
                tx.type === "INCOME" ? Number(tx.amount) : -Number(tx.amount);
              return (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {tx.description ?? typeLabels[tx.type]}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(tx.date)} · {typeLabels[tx.type]}
                    </p>
                  </div>
                  <Money amount={signed} showSign />
                </li>
              );
            })}
          </ul>
          <ScrollTable className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Açıklama</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const signed =
                    tx.type === "INCOME" ? Number(tx.amount) : -Number(tx.amount);
                  return (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>{typeLabels[tx.type]}</TableCell>
                      <TableCell>{tx.description ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Money amount={signed} showSign />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollTable>
        </>
      )}
    </div>
  );
}
