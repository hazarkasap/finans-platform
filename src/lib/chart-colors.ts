import type { ExpenseCategory } from "@/lib/expense-badges";

/** Grafiklerde kullanılan yumuşak, göz yormayan palet */
export const CHART = {
  positive: "#8fbfb0",
  negative: "#d4a5a5",
  neutral: "#a8b0bc",
  income: "#8fbfb0",
  expense: "#d4a5a5",
} as const;

export const CHART_ACCOUNT_COLORS = [
  "#9eb5d4",
  "#8fbfb0",
  "#d4c4a8",
  "#b8a8d4",
  "#d4b0c0",
  "#8fc4d4",
  "#c4d4a0",
  "#e0c4a8",
] as const;

export const CHART_BILL_COLORS = {
  pending: "#d4c4a8",
  overdue: "#d4a5a5",
  paid: "#8fbfb0",
} as const;

const CATEGORY_CHART_COLORS: Record<ExpenseCategory, string> = {
  MARKET: "#a8c484",
  FOOD: "#d4b088",
  RENT: "#b0a0d0",
  UTILITIES: "#88c0d8",
  TRANSPORT: "#9eb5d4",
  ENTERTAINMENT: "#d4a8c0",
  HEALTH: "#d49898",
  TRAVEL: "#88c8d0",
  OTHER: "#b0b4bc",
};

export function getCategoryChartColor(category: string): string {
  return (
    CATEGORY_CHART_COLORS[category as ExpenseCategory] ??
    CATEGORY_CHART_COLORS.OTHER
  );
}

export const PORTFOLIO_PIE_COLORS = {
  alacak: CHART.positive,
  borc: CHART.negative,
} as const;
