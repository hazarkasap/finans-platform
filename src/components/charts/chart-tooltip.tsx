"use client";

import { formatTry } from "@/lib/utils";

type TooltipPayloadItem = {
  value?: number | string;
  name?: string;
  dataKey?: string | number;
  color?: string;
  payload?: Record<string, unknown>;
};

export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload;
  const title =
    (typeof label === "string" && label.length > 0 ? label : undefined) ??
    (typeof row?.label === "string" ? row.label : undefined) ??
    (typeof row?.name === "string" ? row.name : undefined);

  const entries = payload
    .map((item) => ({
      key: String(item.dataKey ?? item.name ?? ""),
      name: String(item.name ?? item.dataKey ?? ""),
      value: Number(item.value),
      color: item.color,
    }))
    .filter((item) => !Number.isNaN(item.value));

  const visible = entries.filter((item) => item.value > 0.01);
  const lines = visible.length > 0 ? visible : entries;

  if (lines.length === 0) return null;

  return (
    <div className="z-50 min-w-[8rem] rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm shadow-lg">
      {title ?
        <p className="mb-1.5 font-medium text-[var(--foreground)]">{title}</p>
      : null}
      <ul className="space-y-1">
        {lines.map((line) => (
          <li
            key={line.key}
            className="flex items-center justify-between gap-3"
          >
            <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
              {line.color ?
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: line.color }}
                />
              : null}
              {line.name}
            </span>
            <span className="font-semibold tabular-nums text-[var(--foreground)]">
              {formatTry(line.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
