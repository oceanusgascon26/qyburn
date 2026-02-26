"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface LicenseUsageData {
  name: string;
  used: number;
  total: number;
}

const colors = ["#9333EA", "#22C55E", "#3B82F6", "#EAB308", "#EC4899"];

export function LicenseUsageChart({ data }: { data?: LicenseUsageData[] }) {
  const chartData = data ?? [
    { name: "M365 E3", used: 156, total: 200 },
    { name: "Adobe CC", used: 24, total: 30 },
    { name: "JetBrains", used: 38, total: 50 },
    { name: "Slack Pro", used: 156, total: 200 },
    { name: "Figma", used: 15, total: 20 },
  ];

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2E1D47" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748B"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1029",
              border: "1px solid #2E1D47",
              borderRadius: "8px",
              color: "#F1F5F9",
              fontSize: "12px",
            }}
            formatter={(value) => [
              value as number,
              "",
            ]}
          />
          <Bar dataKey="total" fill="#2E1D47" radius={[4, 4, 0, 0]} name="total" />
          <Bar dataKey="used" radius={[4, 4, 0, 0]} name="used">
            {chartData.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
