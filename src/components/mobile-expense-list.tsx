import type { ExpenseDetail } from "@/components/groups/expense-detail-sheet";
import { ExpenseBadges } from "@/components/expense-badges";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { formatDate, userLabel } from "@/lib/format";

export function MobileExpenseList({
  expenses,
  onSelect,
  onDelete,
}: {
  expenses: ExpenseDetail[];
  onSelect?: (expense: ExpenseDetail) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="space-y-3 md:hidden">
      {expenses.map((exp) => (
        <li
          key={exp.id}
          className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
        >
          <button
            type="button"
            className="w-full p-4 text-left"
            onClick={() => onSelect?.(exp)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">
                  {exp.description ?? "Gider"}
                </p>
                <p className="text-xs text-zinc-500">{formatDate(exp.date)}</p>
                <ExpenseBadges
                  className="mt-2"
                  category={exp.category}
                  splitType={exp.splitType}
                  multiPayer={(exp.payments?.length ?? 0) > 1}
                />
              </div>
              <Money amount={Number(exp.totalAmount)} className="shrink-0" />
            </div>
            <p className="mt-2 text-xs text-zinc-500 truncate">
              {exp.payments && exp.payments.length > 1 ?
                exp.payments
                  .map((p) => `${userLabel(p.user)} ${Number(p.paidAmount)}₺`)
                  .join(", ")
              : userLabel(exp.paidBy)}
            </p>
            {onSelect ?
              <p className="mt-2 text-xs text-zinc-400">Detay için dokunun</p>
            : null}
          </button>
          <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="w-full sm:w-auto"
              onClick={() => onDelete(exp.id)}
            >
              Sil
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
