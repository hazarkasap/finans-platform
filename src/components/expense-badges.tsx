"use client";

import {
  EXPENSE_CATEGORIES,
  getCategoryConfig,
  getSplitTypeConfig,
  type ExpenseCategory,
} from "@/lib/expense-badges";
import { cn } from "@/lib/utils";

const badgeBase =
  "inline-flex items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium";

export function CategoryBadge({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const cfg = getCategoryConfig(category);
  return (
    <span className={cn(badgeBase, cfg.className, className)}>{cfg.label}</span>
  );
}

export function SplitTypeBadge({
  splitType,
  className,
}: {
  splitType: string;
  className?: string;
}) {
  const cfg = getSplitTypeConfig(splitType);
  return (
    <span className={cn(badgeBase, cfg.className, className)}>{cfg.label}</span>
  );
}

export function FlagBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        badgeBase,
        "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function ExpenseBadges({
  category,
  splitType,
  multiPayer,
  className,
}: {
  category: string;
  splitType: string;
  multiPayer?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      <CategoryBadge category={category} />
      <SplitTypeBadge splitType={splitType} />
      {multiPayer ? <FlagBadge label="Çoklu ödeyen" /> : null}
    </div>
  );
}

export function CategoryFilterChips({
  value,
  onChange,
  counts,
}: {
  value: ExpenseCategory | "ALL";
  onChange: (v: ExpenseCategory | "ALL") => void;
  counts?: Partial<Record<ExpenseCategory | "ALL", number>>;
}) {
  const chips: { id: ExpenseCategory | "ALL"; label: string }[] = [
    { id: "ALL", label: "Tümü" },
    ...EXPENSE_CATEGORIES.map((c) => ({ id: c.value, label: c.label })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 overscroll-x-contain">
      {chips.map((chip) => {
        const active = value === chip.id;
        const count = counts?.[chip.id];
        const cfg =
          chip.id === "ALL" ?
            {
              className:
                "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
            }
          : getCategoryConfig(chip.id);
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onChange(chip.id)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active ?
                cn(
                  cfg.className,
                  "ring-2 ring-zinc-400 ring-offset-1 dark:ring-zinc-500",
                )
              : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:bg-[var(--nav-hover)] hover:text-[var(--foreground)]",
            )}
          >
            {chip.label}
            {count !== undefined ? ` (${count})` : ""}
          </button>
        );
      })}
    </div>
  );
}
