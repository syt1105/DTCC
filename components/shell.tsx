"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  History,
  LineChart,
  RefreshCcw,
  Settings,
  SunMoon
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/", label: "CVE Queue", icon: ClipboardList },
  { href: "/audit", label: "Audit Log", icon: History },
  { href: "/report", label: "Weekly Report", icon: LineChart }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="flex border-b border-white/10 bg-navy text-white lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col lg:border-b-0">
        <div className="flex w-full items-center justify-between px-4 py-4 lg:flex-col lg:items-stretch lg:p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-12 w-28 items-center justify-center rounded-[12px] border border-white/10 bg-white px-3 shadow-lg shadow-black/15">
              <img alt="DTCC" className="h-auto w-full" src="/dtcc-logo.svg" />
            </div>
            <div>
              <div className="text-base font-semibold">TVA Review</div>
              <div className="hidden text-xs text-greenLight/80 lg:block">AI assistant for SSVC Framework</div>
            </div>
          </Link>

          <nav className="hidden space-y-2 pt-12 lg:block">
            {navItems.map((item, index) => (
              <NavLink key={`${item.label}-${index}`} {...item} />
            ))}
          </nav>

          <div className="hidden grow lg:block" />

          <div className="hidden space-y-4 lg:block">
            <Link
              className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-left text-sm text-greenLight/80 hover:bg-white/10 hover:text-white"
              href="/settings"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <div className="flex items-end justify-between border-t border-white/10 pt-4 text-xs text-greenLight/75">
              <div>
                <div>Last updated</div>
                <div className="mt-1 text-white">Jun 30, 2026 10:24 AM</div>
              </div>
              <RefreshCcw className="h-4 w-4" />
            </div>
          </div>

          <Button
            aria-label="Toggle theme"
            className="border-white/15 bg-white/10 text-white hover:bg-white/15 lg:hidden"
            size="icon"
            variant="ghost"
            onClick={() => setDark((value) => !value)}
          >
            <SunMoon className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex items-center gap-1 px-2 lg:hidden">
          {navItems.map((item, index) => (
            <NavLink key={`${item.label}-mobile-${index}`} {...item} compact />
          ))}
        </nav>
      </aside>

      <main className="w-full lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>

      <Button
        aria-label="Toggle theme"
        className="fixed bottom-5 right-5 hidden shadow-enterprise lg:inline-flex"
        size="icon"
        variant="outline"
        onClick={() => setDark((value) => !value)}
      >
        <SunMoon className="h-4 w-4" />
      </Button>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  compact
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active =
    label === "CVE Queue"
      ? pathname === "/" || pathname.startsWith("/cves")
      : label === "Audit Log"
        ? pathname === "/audit"
        : pathname === href;

  return (
    <Link
      className={cn(
        "flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-greenLight/80 transition-colors hover:bg-white/10 hover:text-white",
        active && "bg-greenAccent text-white shadow-lg shadow-black/15",
        compact && "h-11 justify-center px-2 text-xs"
      )}
      href={href}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className={compact ? "sr-only sm:not-sr-only" : ""}>{label}</span>
    </Link>
  );
}
