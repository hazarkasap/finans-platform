"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CHART } from "@/lib/chart-colors";
import {
  aggregateByCategory,
  aggregateByMonth,
  type ExpenseAmountRow,
} from "@/lib/expense-aggregates";
import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  chartAxisTick,
  chartTooltipCursor,
} from "@/components/charts/chart-theme";

export function ExpenseCharts({ expenses }: { expenses: ExpenseAmountRow[] }) {
  const byCategory = aggregateByCategory(expenses);
  const byMonth = aggregateByMonth(expenses);
  const grandTotal = expenses.reduce(
    (sum, e) => sum + Number(e.totalAmount),
    0,
  );

  if (expenses.length === 0) {
    return <EmptyState title="Grafik için henüz gider yok" />;
  }

  const pieData = byCategory.map((c) => ({
    name: c.label,
    value: c.total,
    color: c.color,
  }));

  const barData = byMonth.map((m) => ({
    label: m.label,
    total: m.total,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Toplam harcama</CardTitle>
          <CardDescription>
            {expenses.length} gider kaydı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">
            <Money amount={grandTotal} />
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Kategoriye göre</CardTitle>
          <CardDescription>Harcama dağılımı</CardDescription>
        </CardHeader>
        <CardContent>
          {byCategory.length === 0 ?
            <p className="text-sm text-zinc-500">Veri yok</p>
          : <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} cursor={chartTooltipCursor} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-2">
                {byCategory.map((c) => {
                  const pct =
                    grandTotal > 0 ?
                      Math.round((c.total / grandTotal) * 100)
                    : 0;
                  return (
                    <li
                      key={c.category}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        {c.label}
                        <span className="text-zinc-500">({c.count})</span>
                      </span>
                      <span className="font-medium">
                        <Money amount={c.total} className="inline" />
                        <span className="ml-1 text-zinc-500">%{pct}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          }
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Aylık trend</CardTitle>
          <CardDescription>Zaman içinde toplam gider</CardDescription>
        </CardHeader>
        <CardContent>
          {barData.length === 0 ?
            <p className="text-sm text-zinc-500">Veri yok</p>
          : <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                  />
                  <XAxis
                    dataKey="label"
                    tick={chartAxisTick}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={chartAxisTick}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                    }
                  />
                  <Tooltip content={<ChartTooltip />} cursor={chartTooltipCursor} />
                  <Bar
                    dataKey="total"
                    fill={CHART.neutral}
                    radius={[4, 4, 0, 0]}
                    name="Toplam"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          }
        </CardContent>
      </Card>
    </div>
  );
}
