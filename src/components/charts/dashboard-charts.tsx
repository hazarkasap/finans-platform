"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  chartAxisTick,
  chartTooltipCursor,
} from "@/components/charts/chart-theme";
import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/money";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CHART, PORTFOLIO_PIE_COLORS } from "@/lib/chart-colors";
import type {
  AccountBalanceSlice,
  BillStatusSlice,
  MonthlyCashflow,
} from "@/lib/dashboard-stats";

type DashboardChartsProps = {
  accountSlices: AccountBalanceSlice[];
  portfolio: { alacak: number; borc: number; net: number };
  cashflow: MonthlyCashflow[];
  billSlices: BillStatusSlice[];
};

export function DashboardCharts({
  accountSlices,
  portfolio,
  cashflow,
  billSlices,
}: DashboardChartsProps) {
  const hasAny =
    accountSlices.length > 0 ||
    portfolio.alacak > 0 ||
    portfolio.borc > 0 ||
    cashflow.some((m) => m.income > 0 || m.expense > 0) ||
    billSlices.length > 0;

  if (!hasAny) {
    return (
      <EmptyState title="Grafik için henüz yeterli veri yok" />
    );
  }

  const portfolioPie = [
    { name: "Alacağım", value: portfolio.alacak, color: PORTFOLIO_PIE_COLORS.alacak },
    { name: "Borcum", value: portfolio.borc, color: PORTFOLIO_PIE_COLORS.borc },
  ].filter((row) => row.value > 0.01);

  const cashflowHasData = cashflow.some(
    (m) => m.income > 0 || m.expense > 0,
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Grafikler</h2>
      <div className="grid gap-6 lg:grid-cols-2">
        {accountSlices.length > 0 ?
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Hesap bakiyeleri</CardTitle>
              <CardDescription>Kişisel hesaplarınızdaki dağılım</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountSlices}
                      dataKey="balance"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {accountSlices.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} cursor={chartTooltipCursor} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {accountSlices.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.name}
                    </span>
                    <Money amount={row.balance} className="inline shrink-0" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        : null}

        {portfolioPie.length > 0 ?
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Grup borç özeti</CardTitle>
              <CardDescription>
                Net: <Money amount={portfolio.net} showSign className="inline" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={portfolioPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {portfolioPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} cursor={chartTooltipCursor} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        : null}

        {cashflowHasData ?
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Aylık gelir / gider</CardTitle>
              <CardDescription>Son 6 ay — tüm hesaplar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashflow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-[var(--border)]"
                    />
                    <XAxis dataKey="label" tick={chartAxisTick} />
                    <YAxis
                      tick={chartAxisTick}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                      }
                    />
                    <Tooltip content={<ChartTooltip />} cursor={chartTooltipCursor} />
                    <Legend />
                    <Bar
                      dataKey="income"
                      fill={CHART.income}
                      name="Gelir"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="expense"
                      fill={CHART.expense}
                      name="Gider"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        : null}

        {billSlices.length > 0 ?
          <Card className={cashflowHasData ? "" : "lg:col-span-2"}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Faturalar (tutar)</CardTitle>
              <CardDescription>Duruma göre toplam tutar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={billSlices}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {billSlices.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} cursor={chartTooltipCursor} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {billSlices.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.name}
                    </span>
                    <Money amount={row.value} className="inline" />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        : null}
      </div>
    </div>
  );
}
