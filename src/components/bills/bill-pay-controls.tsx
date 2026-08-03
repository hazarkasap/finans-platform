"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { touchSelectClass } from "@/lib/ui-classes";

const accountTypeLabels: Record<string, string> = {
  CASH: "Nakit",
  BANK: "Banka",
  INVESTMENT: "Yatırım",
};

export type AccountOption = {
  id: string;
  name: string;
  type: string;
};

export function BillPayControls({
  billId,
  accounts,
  defaultAccountId,
  onPay,
  compact = false,
}: {
  billId: string;
  accounts: AccountOption[];
  defaultAccountId: string;
  onPay: (billId: string, accountId: string) => Promise<void>;
  compact?: boolean;
}) {
  const [accountId, setAccountId] = useState(defaultAccountId);
  const [loading, setLoading] = useState(false);

  if (accounts.length === 0) {
    return (
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">
        Ödeme kaydı için önce bir hesap ekleyin.
      </p>
    );
  }

  async function handlePay() {
    setLoading(true);
    try {
      await onPay(billId, accountId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={
        compact ?
          "mt-3 space-y-2"
        : "flex flex-col gap-2 sm:flex-row sm:items-end"
      }
    >
      <div className={compact ? "space-y-1" : "min-w-[12rem] flex-1 space-y-1"}>
        <Label htmlFor={`pay-account-${billId}`} className="text-xs">
          Ödeme hesabı
        </Label>
        <select
          id={`pay-account-${billId}`}
          className={touchSelectClass}
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          disabled={loading}
        >
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name} ({accountTypeLabels[account.type] ?? account.type})
            </option>
          ))}
        </select>
      </div>
      <Button
        size="sm"
        variant="outline"
        type="button"
        className={compact ? "w-full" : undefined}
        disabled={loading || !accountId}
        onClick={handlePay}
      >
        {loading ? "Kaydediliyor…" : "Ödendi olarak işaretle"}
      </Button>
    </div>
  );
}
