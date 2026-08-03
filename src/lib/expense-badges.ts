import type { SplitTypeKind } from "@/lib/debt";

export type ExpenseCategory =
  | "MARKET"
  | "FOOD"
  | "RENT"
  | "UTILITIES"
  | "TRANSPORT"
  | "ENTERTAINMENT"
  | "HEALTH"
  | "TRAVEL"
  | "OTHER";

export const EXPENSE_CATEGORIES: {
  value: ExpenseCategory;
  label: string;
  className: string;
}[] = [
  {
    value: "MARKET",
    label: "Market",
    className:
      "bg-lime-100 text-lime-900 dark:bg-lime-950/50 dark:text-lime-200",
  },
  {
    value: "FOOD",
    label: "Yemek",
    className:
      "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200",
  },
  {
    value: "RENT",
    label: "Kira",
    className:
      "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-200",
  },
  {
    value: "UTILITIES",
    label: "Fatura",
    className:
      "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
  },
  {
    value: "TRANSPORT",
    label: "Ulaşım",
    className:
      "bg-blue-100 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200",
  },
  {
    value: "ENTERTAINMENT",
    label: "Eğlence",
    className:
      "bg-pink-100 text-pink-900 dark:bg-pink-950/50 dark:text-pink-200",
  },
  {
    value: "HEALTH",
    label: "Sağlık",
    className:
      "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200",
  },
  {
    value: "TRAVEL",
    label: "Seyahat",
    className:
      "bg-cyan-100 text-cyan-900 dark:bg-cyan-950/50 dark:text-cyan-200",
  },
  {
    value: "OTHER",
    label: "Diğer",
    className:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
];

const categoryMap = Object.fromEntries(
  EXPENSE_CATEGORIES.map((c) => [c.value, c]),
) as Record<ExpenseCategory, (typeof EXPENSE_CATEGORIES)[number]>;

export function getCategoryConfig(category: string) {
  return categoryMap[category as ExpenseCategory] ?? categoryMap.OTHER;
}

export const SPLIT_TYPE_BADGES: Record<
  SplitTypeKind,
  { label: string; className: string }
> = {
  EQUAL: {
    label: "Eşit",
    className:
      "bg-zinc-200/80 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
  },
  EXACT: {
    label: "Tutar",
    className:
      "bg-indigo-100 text-indigo-900 dark:bg-indigo-950/50 dark:text-indigo-200",
  },
  PERCENTAGE: {
    label: "Yüzde",
    className:
      "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  },
  SHARES: {
    label: "Hisse",
    className:
      "bg-teal-100 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200",
  },
};

export function getSplitTypeConfig(splitType: string) {
  return (
    SPLIT_TYPE_BADGES[splitType as SplitTypeKind] ?? {
      label: splitType,
      className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800",
    }
  );
}
