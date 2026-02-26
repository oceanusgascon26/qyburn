"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  licenses: "License Catalog",
  groups: "Restricted Groups",
  onboarding: "Onboarding",
  audit: "Audit Log",
  knowledge: "Knowledge Base",
  activity: "Bot Activity",
  settings: "Settings",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname?.split("/").filter(Boolean) ?? [];

  return (
    <nav className="flex items-center gap-1.5 text-sm text-silver-500">
      <Link
        href="/dashboard"
        className="hover:text-silver-200 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, i) => {
        const href = "/" + segments.slice(0, i + 1).join("/");
        const label = labelMap[segment] || segment;
        const isLast = i === segments.length - 1;
        return (
          <span key={segment} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-silver-600" />
            {isLast ? (
              <span className="text-silver-200 font-medium">{label}</span>
            ) : (
              <Link
                href={href}
                className="hover:text-silver-200 transition-colors"
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
