"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { touchSelectClass } from "@/lib/ui-classes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch } from "@/lib/api-client";

type AccountItem = {
  id: string;
  name: string;
  type: string;
  currency: string;
  initialBalance: string | number;
  balance: number;
};

const accountTypeLabels: Record<string, string> = {
  CASH: "Nakit",
  BANK: "Banka",
  INVESTMENT: "Yatırım",
};

export function AccountsPanel({
  initialAccounts,
}: {
  initialAccounts: AccountItem[];
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"CASH" | "BANK" | "INVESTMENT">("CASH");
  const [initialBalance, setInitialBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { account } = await apiFetch<{
        account: AccountItem;
      }>("/api/accounts", {
        method: "POST",
        body: JSON.stringify({
          name,
          type,
          initialBalance: Number(initialBalance),
        }),
      });
      setAccounts((prev) => [
        {
          ...account,
          balance: Number(account.initialBalance),
        },
        ...prev,
      ]);
      setName("");
      setInitialBalance("0");
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Hesap oluşturulamadı");
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Kişisel hesaplar"
        description="Nakit ve banka hesaplarınızı takip edin"
        action={
          <Button
            onClick={() => setShowForm(!showForm)}
            className="w-full sm:w-auto"
          >
            {showForm ? "İptal" : "Yeni hesap"}
          </Button>
        }
      />

      {showForm ? (
        <form
          onSubmit={createAccount}
          className="max-w-md space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          {error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="accName">Hesap adı</Label>
            <Input
              id="accName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accType">Tür</Label>
            <select
              id="accType"
              className={touchSelectClass}
              value={type}
              onChange={(e) =>
                setType(e.target.value as "CASH" | "BANK" | "INVESTMENT")
              }
            >
              <option value="CASH">Nakit</option>
              <option value="BANK">Banka</option>
              <option value="INVESTMENT">Yatırım</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="initial">Başlangıç bakiyesi</Label>
            <Input
              id="initial"
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Oluştur
          </Button>
        </form>
      ) : null}

      {accounts.length === 0 ? (
        <EmptyState
          title="Henüz hesap yok"
          description="İlk kişisel hesabınızı oluşturun."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <Link key={account.id} href={`/accounts/${account.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{account.name}</CardTitle>
                  <CardDescription>
                    {accountTypeLabels[account.type] ?? account.type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Money amount={account.balance} showSign />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
