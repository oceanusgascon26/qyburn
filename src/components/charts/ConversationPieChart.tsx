"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "License Requests", value: 28, color: "#9333EA" },
  { name: "KB Queries", value: 22, color: "#3B82F6" },
  { name: "Group Access", value: 15, color: "#22C55E" },
  { name: "Password Help", value: 12, color: "#EAB308" },
  { name: "Other", value: 6, color: "#64748B" },
];

export function ConversationPieChart() {
  return (
    <div className="flex items-center gap-4">
      <div className="h-48 w-48 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1A1029",
                border: "1px solid #2E1D47",
                borderRadius: "8px",
                color: "#F1F5F9",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-silver-300">{item.name}</span>
            <span className="text-silver-500 font-mono text-xs ml-auto">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
