"use client";

import { useMemo, useState } from "react";

import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, apiFetch } from "@/lib/api-client";
import {
  buildExpenseSplits,
  DebtValidationError,
  normalizePayments,
  type SplitTypeKind,
} from "@/lib/debt";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/expense-badges";
import { formatMoney, todayIsoDate, userLabel } from "@/lib/format";
import { touchSelectClass } from "@/lib/ui-classes";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  email: string;
  displayName: string | null;
};

const splitTypeLabels: Record<SplitTypeKind, string> = {
  EQUAL: "Eşit",
  EXACT: "Tutar",
  PERCENTAGE: "Yüzde",
  SHARES: "Hisse",
};

type PaymentRow = { userId: string; paidAmount: string };

export function ExpenseForm({
  groupId,
  members,
  currentUserId,
  onSuccess,
}: {
  groupId: string;
  members: Member[];
  currentUserId: string;
  onSuccess: () => void;
}) {
  const [totalAmount, setTotalAmount] = useState("");
  const [date, setDate] = useState(todayIsoDate());
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [splitType, setSplitType] = useState<SplitTypeKind>("EQUAL");
  const [participants, setParticipants] = useState<Set<string>>(
    () => new Set(members.map((m) => m.id)),
  );
  const [payments, setPayments] = useState<PaymentRow[]>([
    { userId: currentUserId || members[0]?.id || "", paidAmount: "" },
  ]);
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shareValues, setShareValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const participantIds = members
    .filter((m) => participants.has(m.id))
    .map((m) => m.id);

  const total = Number(totalAmount) || 0;

  const preview = useMemo(() => {
    if (total <= 0 || participantIds.length === 0) return null;
    try {
      const normalizedPayments = normalizePayments(
        total,
        payments
          .filter((p) => p.userId && Number(p.paidAmount) > 0)
          .map((p) => ({
            userId: p.userId,
            paidAmount: Number(p.paidAmount),
          })),
        payments.length === 1 && payments[0]?.userId ?
          payments[0].userId
        : undefined,
      );

      const splits = buildExpenseSplits({
        splitType,
        totalAmount: total,
        participantIds,
        splits:
          splitType === "EXACT" ?
            participantIds.map((id) => ({
              userId: id,
              owedAmount: Number(exactAmounts[id] || 0),
            }))
          : undefined,
        percentages:
          splitType === "PERCENTAGE" ?
            participantIds.map((id) => ({
              userId: id,
              percent: Number(percentages[id] || 0),
            }))
          : undefined,
        shares:
          splitType === "SHARES" ?
            participantIds.map((id) => ({
              userId: id,
              shares: Number(shareValues[id] || 1),
            }))
          : undefined,
      });

      return { payments: normalizedPayments, splits };
    } catch {
      return null;
    }
  }, [
    total,
    participantIds,
    splitType,
    payments,
    exactAmounts,
    percentages,
    shareValues,
  ]);

  function toggleParticipant(userId: string) {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        if (next.size > 1) next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function addPaymentRow() {
    setPayments((prev) => [
      ...prev,
      { userId: members[0]?.id || "", paidAmount: "" },
    ]);
  }

  function updatePayment(index: number, field: keyof PaymentRow, value: string) {
    setPayments((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  function removePaymentRow(index: number) {
    setPayments((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body: Record<string, unknown> = {
        totalAmount: total,
        date,
        description: description || undefined,
        category,
        splitType,
        participantIds,
        payments: payments
          .filter((p) => p.userId && Number(p.paidAmount) > 0)
          .map((p) => ({
            userId: p.userId,
            paidAmount: Number(p.paidAmount),
          })),
      };

      if (splitType === "EXACT") {
        body.splits = participantIds.map((id) => ({
          userId: id,
          owedAmount: Number(exactAmounts[id] || 0),
        }));
      } else if (splitType === "PERCENTAGE") {
        body.percentages = participantIds.map((id) => ({
          userId: id,
          percent: Number(percentages[id] || 0),
        }));
      } else if (splitType === "SHARES") {
        body.shares = participantIds.map((id) => ({
          userId: id,
          shares: Number(shareValues[id] || 1),
        }));
      }

      await apiFetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setTotalAmount("");
      setDescription("");
      setPayments([
        { userId: currentUserId || members[0]?.id || "", paidAmount: "" },
      ]);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof DebtValidationError) {
        setError(err.message);
      } else {
        setError("Gider eklenemedi");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount">Toplam tutar (TRY)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expDate">Tarih</Label>
          <Input
            id="expDate"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Kategori</Label>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  category === cat.value ?
                    cn(cat.className, "ring-2 ring-zinc-400 ring-offset-1")
                  : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="splitType">Bölüşüm</Label>
          <select
            id="splitType"
            className={touchSelectClass}
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as SplitTypeKind)}
          >
            {(Object.keys(splitTypeLabels) as SplitTypeKind[]).map((key) => (
              <option key={key} value={key}>
                {splitTypeLabels[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Açıklama</Label>
          <Input
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Katılımcılar</Label>
        <div className="flex flex-wrap gap-3">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={participants.has(m.id)}
                onChange={() => toggleParticipant(m.id)}
              />
              {userLabel(m)}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Ödemeler</Label>
          <Button type="button" variant="outline" size="sm" onClick={addPaymentRow}>
            + Ödeyen ekle
          </Button>
        </div>
        {payments.map((row, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <select
              className={`${touchSelectClass} sm:min-w-[140px] sm:flex-1`}
              value={row.userId}
              onChange={(e) => updatePayment(index, "userId", e.target.value)}
              required
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {userLabel(m)}
                </option>
              ))}
            </select>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Tutar"
              className="w-full sm:w-28"
              value={row.paidAmount}
              onChange={(e) =>
                updatePayment(index, "paidAmount", e.target.value)
              }
              required
            />
            {payments.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removePaymentRow(index)}
              >
                Kaldır
              </Button>
            ) : null}
          </div>
        ))}
        <p className="text-xs text-zinc-500">
          Ödemeler toplamı gider tutarına eşit olmalı (
          {formatMoney(
            payments.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0),
          )}
          / {total > 0 ? formatMoney(total) : "—"})
        </p>
      </div>

      {splitType === "EXACT" && participantIds.length > 0 ? (
        <div className="space-y-2">
          <Label>Pay tutarları (TRY)</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {participantIds.map((id) => {
              const m = members.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-24 truncate text-sm">{m ? userLabel(m) : id}</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={exactAmounts[id] ?? ""}
                    onChange={(e) =>
                      setExactAmounts((prev) => ({
                        ...prev,
                        [id]: e.target.value,
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {splitType === "PERCENTAGE" && participantIds.length > 0 ? (
        <div className="space-y-2">
          <Label>Yüzdeler (toplam %100)</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {participantIds.map((id) => {
              const m = members.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-24 truncate text-sm">{m ? userLabel(m) : id}</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={percentages[id] ?? ""}
                    onChange={(e) =>
                      setPercentages((prev) => ({
                        ...prev,
                        [id]: e.target.value,
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {splitType === "SHARES" && participantIds.length > 0 ? (
        <div className="space-y-2">
          <Label>Hisseler</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {participantIds.map((id) => {
              const m = members.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-24 truncate text-sm">{m ? userLabel(m) : id}</span>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={shareValues[id] ?? "1"}
                    onChange={(e) =>
                      setShareValues((prev) => ({
                        ...prev,
                        [id]: e.target.value,
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {preview ? (
        <div className="rounded-md bg-zinc-50 p-3 text-sm dark:bg-zinc-900">
          <p className="font-medium mb-2">Önizleme</p>
          <ul className="space-y-1">
            {preview.splits.map((s) => {
              const m = members.find((x) => x.id === s.userId);
              return (
                <li key={s.userId}>
                  {m ? userLabel(m) : s.userId}: borçlu{" "}
                  <Money amount={s.owedAmount} />
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Kaydediliyor…" : "Gider ekle"}
      </Button>
    </form>
  );
}
