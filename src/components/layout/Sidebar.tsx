"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KeyRound,
  ShieldCheck,
  UserPlus,
  ScrollText,
  BookOpen,
  Settings,
  Bot,
  Flame,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "License Catalog", href: "/dashboard/licenses", icon: KeyRound },
  { name: "Restricted Groups", href: "/dashboard/groups", icon: ShieldCheck },
  { name: "Onboarding", href: "/dashboard/onboarding", icon: UserPlus },
  { name: "Audit Log", href: "/dashboard/audit", icon: ScrollText },
  { name: "Knowledge Base", href: "/dashboard/knowledge", icon: BookOpen },
  { name: "Bot Activity", href: "/dashboard/activity", icon: Bot },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-qy-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-qyburn-700">
          <Flame className="h-5 w-5 text-wildfire-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Qyburn
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-qyburn-400">
            IT Admin
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-qyburn-800/80 text-white shadow-sm shadow-qyburn-900/50"
                  : "text-silver-400 hover:bg-qyburn-900/50 hover:text-silver-200"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] flex-shrink-0",
                  isActive ? "text-wildfire-400" : "text-silver-500"
                )}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-qy-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-qyburn-700 flex items-center justify-center">
            <span className="text-xs font-bold text-qyburn-200">SA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-silver-200 truncate">
              SAGA Admin
            </p>
            <p className="text-xs text-silver-500 truncate">IT Department</p>
          </div>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-[60] lg:hidden rounded-lg bg-qyburn-900 p-2 text-silver-300 hover:text-white shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[80] flex w-[260px] flex-col bg-qyburn-950 border-r border-qy-border transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-silver-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-[260px] flex-col bg-qyburn-950 border-r border-qy-border">
        <SidebarContent />
      </aside>
    </>
  );
}
