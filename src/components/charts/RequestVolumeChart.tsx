"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { day: "Mon", requests: 42, resolved: 39 },
  { day: "Tue", requests: 56, resolved: 52 },
  { day: "Wed", requests: 61, resolved: 58 },
  { day: "Thu", requests: 48, resolved: 45 },
  { day: "Fri", requests: 72, resolved: 68 },
  { day: "Sat", requests: 18, resolved: 17 },
  { day: "Sun", requests: 12, resolved: 11 },
];

export function RequestVolumeChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9333EA" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#9333EA" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradientGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2E1D47" />
          <XAxis
            dataKey="day"
            stroke="#64748B"
            fontSize={12}
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
          />
          <Area
            type="monotone"
            dataKey="requests"
            stroke="#9333EA"
            strokeWidth={2}
            fill="url(#gradientPurple)"
            name="Requests"
          />
          <Area
            type="monotone"
            dataKey="resolved"
            stroke="#22C55E"
            strokeWidth={2}
            fill="url(#gradientGreen)"
            name="Resolved"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
