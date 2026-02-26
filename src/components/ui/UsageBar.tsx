"use client";

import { cn } from "@/lib/utils";

interface UsageBarProps {
  used: number;
  total: number;
  className?: string;
}

export function UsageBar({ used, total, className }: UsageBarProps) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const isHigh = pct >= 90;
  const isMed = pct >= 70 && pct < 90;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-2 rounded-full bg-qy-surface-light overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isHigh && "bg-red-500",
            isMed && "bg-yellow-500",
            !isHigh && !isMed && "bg-qyburn-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-silver-400 whitespace-nowrap font-mono">
        {used}/{total} ({pct}%)
      </span>
    </div>
  );
}
