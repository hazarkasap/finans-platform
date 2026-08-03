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

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import {
  chartAxisTick,
  chartAxisTickSm,
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
import { userLabel } from "@/lib/format";
import type { PortfolioContact } from "@/lib/portfolio";

type PortfolioChartsProps = {
  summary: {
    totalOwedToYou: number;
    totalYouOwe: number;
    netPosition: number;
  };
  owedToYou: PortfolioContact[];
  youOwe: PortfolioContact[];
};

export function PortfolioCharts({
  summary,
  owedToYou,
  youOwe,
}: PortfolioChartsProps) {
  const hasData =
    summary.totalOwedToYou > 0 ||
    summary.totalYouOwe > 0 ||
    owedToYou.length > 0 ||
    youOwe.length > 0;

  if (!hasData) {
    return (
      <EmptyState title="Grafik için borç veya alacak verisi yok" />
    );
  }

  const positionPie = [
    {
      name: "Alacağım",
      value: summary.totalOwedToYou,
      color: PORTFOLIO_PIE_COLORS.alacak,
    },
    {
      name: "Borcum",
      value: summary.totalYouOwe,
      color: PORTFOLIO_PIE_COLORS.borc,
    },
  ].filter((row) => row.value > 0.01);

  const contactBars = [
    ...owedToYou.map((c) => ({
      label: userLabel(c.user),
      alacak: c.netAmount,
      borc: 0,
    })),
    ...youOwe.map((c) => ({
      label: userLabel(c.user),
      alacak: 0,
      borc: Math.abs(c.netAmount),
    })),
  ]
    .sort((a, b) => b.alacak + b.borc - (a.alacak + a.borc))
    .slice(0, 8);

  const groupMap = new Map<string, { name: string; net: number }>();
  for (const contact of [...owedToYou, ...youOwe]) {
    for (const entry of contact.byGroup) {
      const prev = groupMap.get(entry.groupId);
      const next = (prev?.net ?? 0) + entry.amount;
      groupMap.set(entry.groupId, {
        name: entry.groupName,
        net: next,
      });
    }
  }

  const groupBars = [...groupMap.values()]
    .map((g) => ({
      label: g.name,
      alacak: g.net > 0 ? g.net : 0,
      borc: g.net < 0 ? Math.abs(g.net) : 0,
    }))
    .sort((a, b) => b.alacak + b.borc - (a.alacak + a.borc))
    .slice(0, 8);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alacak / borç dengesi</CardTitle>
          <CardDescription>
            Net: <Money amount={summary.netPosition} showSign className="inline" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positionPie.length === 0 ?
            <p className="text-sm text-[var(--muted-foreground)]">Veri yok</p>
          : <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={positionPie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {positionPie.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} cursor={chartTooltipCursor} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          }
          <ul className="mt-3 space-y-1 text-sm">
            {positionPie.map((row) => (
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

      {contactBars.length > 0 ?
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kişilere göre</CardTitle>
            <CardDescription>En yüksek tutarlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={contactBars}
                  layout="vertical"
                  margin={{ top: 4, right: 8, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-[var(--border)]"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={chartAxisTickSm}
                    tickFormatter={(v) =>
                      v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={88}
                    tick={chartAxisTickSm}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={chartTooltipCursor} />
                  <Bar dataKey="alacak" stackId="a" fill={CHART.positive} radius={[0, 0, 0, 0]} name="Alacağım" />
                  <Bar dataKey="borc" stackId="a" fill={CHART.negative} radius={[0, 4, 4, 0]} name="Borcum" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      : null}

      {groupBars.length > 0 ?
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gruplara göre</CardTitle>
            <CardDescription>Grup bazında alacak ve borç</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupBars} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                  <Bar dataKey="alacak" fill={CHART.positive} name="Alacağım" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="borc" fill={CHART.negative} name="Borcum" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      : null}
    </div>
  );
}
