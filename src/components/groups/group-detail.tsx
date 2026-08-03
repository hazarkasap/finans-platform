"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { ExpenseCharts } from "@/components/groups/expense-charts";
import {
  ExpenseDetailSheet,
  type ExpenseDetail,
} from "@/components/groups/expense-detail-sheet";
import { ExpenseForm } from "@/components/groups/expense-form";
import { MobileBalanceList } from "@/components/mobile-balance-list";
import { MobileExpenseList } from "@/components/mobile-expense-list";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { ScrollTable } from "@/components/scroll-table";
import { touchSelectClass } from "@/lib/ui-classes";
import { allNetsZero } from "@/lib/debt";
import {
  CategoryFilterChips,
  ExpenseBadges,
} from "@/components/expense-badges";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, apiFetch } from "@/lib/api-client";
import type { ExpenseCategory } from "@/lib/expense-badges";
import { formatDate, todayIsoDate, userLabel } from "@/lib/format";

type Member = {
  id: string;
  email: string;
  displayName: string | null;
};

type Expense = ExpenseDetail;

type Settlement = {
  id: string;
  amount: string | number;
  date: string;
  note: string | null;
  fromUser: Member;
  toUser: Member;
};

type BalancesData = {
  members: Member[];
  netBalances: Record<string, number>;
  suggestedTransfers: {
    fromUserId: string;
    toUserId: string;
    amount: number;
  }[];
};

type GroupData = {
  group: {
    id: string;
    name: string;
    memberships: { role: string; user: Member }[];
  };
};

export function GroupDetail({
  groupId,
  currentUserId,
}: {
  groupId: string;
  currentUserId: string;
}) {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [balances, setBalances] = useState<BalancesData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [settlementForm, setSettlementForm] = useState({
    fromUserId: "",
    toUserId: "",
    amount: "",
    date: todayIsoDate(),
    note: "",
  });
  const [memberEmail, setMemberEmail] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "ALL">(
    "ALL",
  );
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredExpenses =
    categoryFilter === "ALL" ?
      expenses
    : expenses.filter((e) => e.category === categoryFilter);

  const categoryCounts = expenses.reduce(
    (acc, e) => {
      const cat = e.category as ExpenseCategory;
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    },
    { ALL: expenses.length } as Partial<Record<ExpenseCategory | "ALL", number>>,
  );

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [groupRes, balancesRes, expensesRes, settlementsRes] =
        await Promise.all([
          apiFetch<GroupData>(`/api/groups/${groupId}`),
          apiFetch<BalancesData>(`/api/groups/${groupId}/balances`),
          apiFetch<{ expenses: Expense[] }>(
            `/api/groups/${groupId}/expenses`,
          ),
          apiFetch<{ settlements: Settlement[] }>(
            `/api/groups/${groupId}/settlements`,
          ),
        ]);

      setGroupName(groupRes.group.name);
      const memberList = groupRes.group.memberships.map((m) => m.user);
      setMembers(memberList);
      setIsOwner(
        groupRes.group.memberships.some(
          (m) => m.user.id === currentUserId && m.role === "OWNER",
        ),
      );
      setBalances(balancesRes);
      setExpenses(expensesRes.expenses);
      setSettlements(settlementsRes.settlements);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Veri yüklenemedi");
    } finally {
      setLoading(false);
    }
  }, [groupId, currentUserId]);

  useEffect(() => {
    const task = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(task);
  }, [load]);

  async function addSettlement(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch(`/api/groups/${groupId}/settlements`, {
        method: "POST",
        body: JSON.stringify({
          fromUserId: settlementForm.fromUserId,
          toUserId: settlementForm.toUserId,
          amount: Number(settlementForm.amount),
          date: settlementForm.date,
          note: settlementForm.note || undefined,
        }),
      });
      setSettlementForm((f) => ({
        ...f,
        amount: "",
        note: "",
      }));
      await load();
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Mahsup eklenemedi");
    }
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    try {
      await apiFetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: memberEmail }),
      });
      setMemberEmail("");
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Üye eklenemedi");
    }
  }

  function openExpenseDetail(expense: Expense) {
    setSelectedExpense(expense);
    setDetailOpen(true);
  }

  async function deleteExpense(expenseId: string) {
    if (!confirm("Bu gideri silmek istediğinize emin misiniz?")) return;
    try {
      await apiFetch(`/api/groups/${groupId}/expenses/${expenseId}`, {
        method: "DELETE",
      });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Silinemedi");
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500">Yükleniyor…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title={groupName}
        description={`${members.length} üye`}
      />

      <Tabs defaultValue="balances">
        <TabsList>
          <TabsTrigger value="balances">Borç özeti</TabsTrigger>
          <TabsTrigger value="expenses">Giderler</TabsTrigger>
          <TabsTrigger value="stats">İstatistikler</TabsTrigger>
          <TabsTrigger value="settlements">Mahsuplar</TabsTrigger>
          <TabsTrigger value="members">Üyeler</TabsTrigger>
        </TabsList>

        <TabsContent value="balances">
          {balances ? (
            <div className="space-y-6">
              <MobileBalanceList
                members={balances.members}
                netBalances={balances.netBalances}
              />
              <ScrollTable className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Üye</TableHead>
                      <TableHead className="text-right">Net bakiye</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.members.map((m) => {
                      const net = balances.netBalances[m.id] ?? 0;
                      return (
                        <TableRow key={m.id}>
                          <TableCell>{userLabel(m)}</TableCell>
                          <TableCell className="text-right">
                            <Money amount={net} showSign />
                            {net > 0 ? (
                              <Badge variant="success" className="ml-2">
                                alacaklı
                              </Badge>
                            ) : net < 0 ? (
                              <Badge variant="danger" className="ml-2">
                                borçlu
                              </Badge>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollTable>

              {balances.suggestedTransfers.length === 0 &&
              allNetsZero(
                new Map(
                  Object.entries(balances.netBalances).map(([k, v]) => [
                    k,
                    v,
                  ]),
                ),
              ) ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Karşılıklı mahsup — ek ödeme gerekmez. Giderler borçları
                  otomatik dengeler; nakit transfer için Mahsuplar sekmesini
                  kullanın.
                </p>
              ) : balances.suggestedTransfers.length > 0 ? (
                <div>
                  <h3 className="mb-2 text-sm font-medium">
                    Önerilen ödemeler
                  </h3>
                  <ul className="space-y-2 text-sm">
                    {balances.suggestedTransfers.map((t, i) => (
                      <li key={i}>
                        {userLabel(memberMap.get(t.fromUserId) ?? { email: "?", displayName: null })}{" "}
                        →{" "}
                        {userLabel(memberMap.get(t.toUserId) ?? { email: "?", displayName: null })}
                        : <Money amount={t.amount} className="inline" />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">
                  Tüm bakiyeler dengede.
                </p>
              )}
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="expenses">
          {expenses.length > 0 ? (
            <div className="mb-4">
              <CategoryFilterChips
                value={categoryFilter}
                onChange={setCategoryFilter}
                counts={categoryCounts}
              />
            </div>
          ) : null}
          <ExpenseForm
            groupId={groupId}
            members={members}
            currentUserId={currentUserId}
            onSuccess={async () => {
              await load();
              router.refresh();
            }}
          />

          {expenses.length === 0 ? (
            <EmptyState title="Henüz gider yok" />
          ) : filteredExpenses.length === 0 ? (
            <EmptyState title="Bu kategoride gider yok" />
          ) : (
            <>
              <MobileExpenseList
                expenses={filteredExpenses}
                onSelect={openExpenseDetail}
                onDelete={deleteExpense}
              />
              <ScrollTable className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Açıklama</TableHead>
                      <TableHead>Kategori / Bölüşüm</TableHead>
                      <TableHead>Ödeyen</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((exp) => (
                      <TableRow
                        key={exp.id}
                        className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        onClick={() => openExpenseDetail(exp)}
                      >
                        <TableCell>{formatDate(exp.date)}</TableCell>
                        <TableCell>{exp.description ?? "—"}</TableCell>
                        <TableCell>
                          <ExpenseBadges
                            category={exp.category}
                            splitType={exp.splitType}
                            multiPayer={(exp.payments?.length ?? 0) > 1}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500">
                          {exp.payments && exp.payments.length > 1 ?
                            exp.payments
                              .map(
                                (p) =>
                                  `${userLabel(p.user)} ${Number(p.paidAmount)}₺`,
                              )
                              .join(", ")
                          : userLabel(exp.paidBy)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Money amount={Number(exp.totalAmount)} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteExpense(exp.id);
                            }}
                          >
                            Sil
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollTable>
            </>
          )}
          <ExpenseDetailSheet
            expense={selectedExpense}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            onDelete={deleteExpense}
          />
        </TabsContent>

        <TabsContent value="stats">
          <ExpenseCharts expenses={expenses} />
        </TabsContent>

        <TabsContent value="settlements">
          <form
            onSubmit={addSettlement}
            className="mb-6 grid gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <Label>Borçlu</Label>
              <select
                className={touchSelectClass}
                value={settlementForm.fromUserId}
                onChange={(e) =>
                  setSettlementForm((f) => ({
                    ...f,
                    fromUserId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Seçin</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {userLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Alacaklı</Label>
              <select
                className={touchSelectClass}
                value={settlementForm.toUserId}
                onChange={(e) =>
                  setSettlementForm((f) => ({
                    ...f,
                    toUserId: e.target.value,
                  }))
                }
                required
              >
                <option value="">Seçin</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {userLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Tutar</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={settlementForm.amount}
                onChange={(e) =>
                  setSettlementForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tarih</Label>
              <Input
                type="date"
                required
                value={settlementForm.date}
                onChange={(e) =>
                  setSettlementForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Not</Label>
              <Input
                value={settlementForm.note}
                onChange={(e) =>
                  setSettlementForm((f) => ({ ...f, note: e.target.value }))
                }
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Mahsup kaydet</Button>
            </div>
          </form>

          {settlements.length === 0 ? (
            <EmptyState title="Henüz mahsup yok" />
          ) : (
            <>
              <ul className="space-y-2 md:hidden">
                {settlements.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <p className="text-xs text-zinc-500">{formatDate(s.date)}</p>
                    <p className="mt-1 text-sm font-medium">
                      {userLabel(s.fromUser)} → {userLabel(s.toUser)}
                    </p>
                    {s.note ? (
                      <p className="text-xs text-zinc-500">{s.note}</p>
                    ) : null}
                    <p className="mt-2">
                      <Money amount={Number(s.amount)} />
                    </p>
                  </li>
                ))}
              </ul>
              <ScrollTable className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Transfer</TableHead>
                      <TableHead className="text-right">Tutar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{formatDate(s.date)}</TableCell>
                        <TableCell>
                          {userLabel(s.fromUser)} → {userLabel(s.toUser)}
                          {s.note ? ` (${s.note})` : ""}
                        </TableCell>
                        <TableCell className="text-right">
                          <Money amount={Number(s.amount)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollTable>
            </>
          )}
        </TabsContent>

        <TabsContent value="members">
          <ul className="mb-6 space-y-2">
            {members.map((m) => (
              <li key={m.id} className="text-sm">
                {userLabel(m)}{" "}
                <span className="text-zinc-500">({m.email})</span>
              </li>
            ))}
          </ul>

          {isOwner ? (
            <form
              onSubmit={addMember}
              className="flex max-w-md flex-col gap-2 sm:flex-row"
            >
              <Input
                type="email"
                placeholder="member@example.com"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" className="w-full sm:w-auto">
                Üye ekle
              </Button>
            </form>
          ) : (
            <p className="text-sm text-zinc-500">
              Üye eklemek için grup sahibi olmalısınız.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
