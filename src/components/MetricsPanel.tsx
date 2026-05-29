import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type { Metrics } from "../types/index.ts";
import type { ReactNode } from "react";

function formatRound(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function ChartWrap({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border border-edge p-4 transition-colors min-w-0">
      <div className="text-xs font-medium text-fg-3 mb-3">{title}</div>
      {children}
    </div>
  );
}

interface MetricsPanelProps {
  metrics: Metrics[];
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  const recent = metrics.slice(-100);

  if (recent.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-edge h-32 flex items-center justify-center text-sm text-fg-3 transition-colors">
        Waiting for data...
      </div>
    );
  }

  const latest = recent[recent.length - 1];

  const kpiCards = [
    {
      label: "Trade Success",
      value: `${latest.tradeSuccessRate.toFixed(1)}%`,
      color: "#059669",
      bg: "#f0fdf4",
    },
    {
      label: "Avg Message Length",
      value: latest.averageMessageLength.toFixed(2),
      color: "#7c3aed",
      bg: "#faf5ff",
    },
    {
      label: "Language Entropy",
      value: latest.languageEntropy.toFixed(3),
      color: "#d97706",
      bg: "#fffbeb",
    },
    {
      label: "Symbol Diversity",
      value: `${latest.symbolDiversity.toFixed(1)}%`,
      color: "#2563eb",
      bg: "#eff6ff",
    },
  ];

  const commonAxisProps = {
    tick: { fill: "#9ca3af", fontSize: 10 },
    tickLine: false as const,
    axisLine: { stroke: "#e8eaed" },
  };

  const commonTooltipStyle = {
    background: "#ffffff",
    border: "1px solid #e8eaed",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card rounded-xl border border-edge px-4 py-3 transition-colors"
          >
            <div className="text-xs font-medium text-fg-3 mb-1">
              {kpi.label}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: kpi.color }}
              />
              <span className="text-lg font-semibold text-fg tracking-tight">
                {kpi.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-4 min-w-0">
        <ChartWrap title="Trade Success Rate — higher is better">
          <ResponsiveContainer width="100%" height={128}>
            <LineChart data={recent}>
              <XAxis
                dataKey="round"
                {...commonAxisProps}
                tickFormatter={formatRound}
                label={{
                  value: "Round",
                  position: "insideBottomRight",
                  offset: -5,
                  style: { fill: "#d1d5db", fontSize: 10 },
                }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                width={32}
                {...commonAxisProps}
              />
              <Tooltip
                contentStyle={commonTooltipStyle}
                formatter={(value: unknown) => [
                  `${Number(value).toFixed(1)}%`,
                  "Success Rate",
                ]}
                labelFormatter={(label) => `Round ${label}`}
              />
              <Line
                type="monotone"
                dataKey="tradeSuccessRate"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#22c55e" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrap>

        <ChartWrap title="Avg Message Length — symbols per message">
          <ResponsiveContainer width="100%" height={128}>
            <LineChart data={recent}>
              <XAxis
                dataKey="round"
                {...commonAxisProps}
                tickFormatter={formatRound}
                label={{
                  value: "Round",
                  position: "insideBottomRight",
                  offset: -5,
                  style: { fill: "#d1d5db", fontSize: 10 },
                }}
              />
              <YAxis width={24} {...commonAxisProps} />
              <Tooltip
                contentStyle={commonTooltipStyle}
                formatter={(value: unknown) => [
                  Number(value).toFixed(2),
                  "Avg symbols",
                ]}
                labelFormatter={(label) => `Round ${label}`}
              />
              <Line
                type="monotone"
                dataKey="averageMessageLength"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#a78bfa" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrap>

        <ChartWrap title="Language Entropy — vocabulary diversity">
          <ResponsiveContainer width="100%" height={128}>
            <LineChart data={recent}>
              <XAxis
                dataKey="round"
                {...commonAxisProps}
                tickFormatter={formatRound}
                label={{
                  value: "Round",
                  position: "insideBottomRight",
                  offset: -5,
                  style: { fill: "#d1d5db", fontSize: 10 },
                }}
              />
              <YAxis width={24} {...commonAxisProps} />
              <Tooltip
                contentStyle={commonTooltipStyle}
                formatter={(value: unknown) => [
                  Number(value).toFixed(3),
                  "Entropy",
                ]}
                labelFormatter={(label) => `Round ${label}`}
              />
              <Line
                type="monotone"
                dataKey="languageEntropy"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#f59e0b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrap>

        <ChartWrap title="Symbol Diversity — % of symbols actively used">
          <ResponsiveContainer width="100%" height={128}>
            <AreaChart data={recent}>
              <XAxis
                dataKey="round"
                {...commonAxisProps}
                tickFormatter={formatRound}
                label={{
                  value: "Round",
                  position: "insideBottomRight",
                  offset: -5,
                  style: { fill: "#d1d5db", fontSize: 10 },
                }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                width={32}
                {...commonAxisProps}
              />
              <Tooltip
                contentStyle={commonTooltipStyle}
                formatter={(value: unknown) => [
                  `${Number(value).toFixed(1)}%`,
                  "Symbols used",
                ]}
                labelFormatter={(label) => `Round ${label}`}
              />
              <Area
                type="monotone"
                dataKey="symbolDiversity"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.06}
                strokeWidth={2}
                activeDot={{ r: 3, fill: "#3b82f6" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrap>
      </div>
    </div>
  );
}
