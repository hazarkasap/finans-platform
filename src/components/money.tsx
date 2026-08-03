import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Money({
  amount,
  currency = "TRY",
  className,
  showSign = false,
}: {
  amount: number;
  currency?: string;
  className?: string;
  showSign?: boolean;
}) {
  const sign =
    showSign && amount > 0 ? "+" : showSign && amount < 0 ? "" : "";
  const color =
    showSign && amount > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : showSign && amount < 0
        ? "text-red-600 dark:text-red-400"
        : undefined;

  return (
    <span className={cn("tabular-nums font-medium", color, className)}>
      {sign}
      {formatMoney(Math.abs(amount), currency)}
    </span>
  );
}
