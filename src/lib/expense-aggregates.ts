import { getCategoryChartColor } from "@/lib/chart-colors";
import {
  EXPENSE_CATEGORIES,
  getCategoryConfig,
  type ExpenseCategory,
} from "@/lib/expense-badges";

export type ExpenseAmountRow = {
  category: string;
  date: string;
  totalAmount: string | number;
};

export type CategoryAggregate = {
  category: ExpenseCategory;
  label: string;
  total: number;
  count: number;
  color: string;
};

export type MonthAggregate = {
  monthKey: string;
  label: string;
  total: number;
};

export function aggregateByCategory(
  expenses: ExpenseAmountRow[],
): CategoryAggregate[] {
  const totals = new Map<ExpenseCategory, { total: number; count: number }>();

  for (const exp of expenses) {
    const cat = (exp.category as ExpenseCategory) || "OTHER";
    const prev = totals.get(cat) ?? { total: 0, count: 0 };
    totals.set(cat, {
      total: prev.total + Number(exp.totalAmount),
      count: prev.count + 1,
    });
  }

  return EXPENSE_CATEGORIES.map((c) => {
    const data = totals.get(c.value);
    return {
      category: c.value,
      label: c.label,
      total: data?.total ?? 0,
      count: data?.count ?? 0,
      color: getCategoryChartColor(c.value),
    };
  }).filter((row) => row.total > 0);
}

export function aggregateByMonth(expenses: ExpenseAmountRow[]): MonthAggregate[] {
  const totals = new Map<string, number>();

  for (const exp of expenses) {
    const d = new Date(exp.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    totals.set(key, (totals.get(key) ?? 0) + Number(exp.totalAmount));
  }

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monthKey, total]) => {
      const [year, month] = monthKey.split("-");
      const label = new Intl.DateTimeFormat("tr-TR", {
        month: "short",
        year: "numeric",
      }).format(new Date(Number(year), Number(month) - 1, 1));
      return { monthKey, label, total };
    });
}

export { getCategoryChartColor } from "@/lib/chart-colors";

export function getCategoryLabel(category: string): string {
  return getCategoryConfig(category).label;
}
