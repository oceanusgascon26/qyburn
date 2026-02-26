"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { hour: "00:00", time: 0.9 },
  { hour: "04:00", time: 0.7 },
  { hour: "08:00", time: 1.4 },
  { hour: "10:00", time: 1.8 },
  { hour: "12:00", time: 1.5 },
  { hour: "14:00", time: 1.2 },
  { hour: "16:00", time: 1.6 },
  { hour: "18:00", time: 1.1 },
  { hour: "20:00", time: 0.8 },
  { hour: "22:00", time: 0.6 },
];

export function ResponseTimeChart() {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2E1D47" />
          <XAxis
            dataKey="hour"
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
            unit="s"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1A1029",
              border: "1px solid #2E1D47",
              borderRadius: "8px",
              color: "#F1F5F9",
              fontSize: "12px",
            }}
            formatter={(value) => [`${value}s`, "Response Time"]}
          />
          <Line
            type="monotone"
            dataKey="time"
            stroke="#EAB308"
            strokeWidth={2}
            dot={{ fill: "#EAB308", r: 3 }}
            activeDot={{ r: 5, fill: "#EAB308" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
