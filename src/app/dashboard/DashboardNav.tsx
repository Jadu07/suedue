"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Users, CreditCard, Settings } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  isActive: (pathname: string) => boolean;
}

const navItems: NavItem[] = [
  {
    name: "Bills",
    href: "/dashboard",
    icon: FileText,
    isActive: (pathname: string) =>
      pathname === "/dashboard" || pathname.startsWith("/dashboard/bills"),
  },
  {
    name: "People",
    href: "/dashboard/people",
    icon: Users,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/people"),
  },
  {
    name: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/payments"),
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/settings"),
  },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-lg space-y-1.5 overflow-y-auto">
      {navItems.map((item) => {
        const active = item.isActive(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            className={`flex items-center gap-md px-md py-2.5 rounded-xl text-xs font-semibold transition-all select-none active:scale-[0.98] ${
              active
                ? "bg-canvas text-ink shadow-2xs font-bold border border-hairline"
                : "text-ink-mute hover:text-ink hover:bg-canvas/50"
            }`}
          >
            <Icon size={18} className={active ? "text-ink" : "text-ink-mute"} />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 grid grid-cols-4 gap-1 bg-canvas/95 backdrop-blur-md border-t border-hairline px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-30 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => {
        const active = item.isActive(pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            className={`flex min-w-0 min-h-12 flex-col items-center justify-center gap-1 rounded-xl transition-all select-none touch-manipulation active:scale-95 ${
              active
                ? "bg-primary/5 text-ink font-black"
                : "text-ink-mute hover:text-ink"
            }`}
          >
            <Icon
              size={20}
              className={`transition-transform duration-150 ${
                active ? "scale-110 text-ink stroke-[2.5]" : "stroke-[1.75]"
              }`}
            />
            <span
              className={`text-[10px] tracking-tight leading-none ${
                active ? "font-bold text-ink" : "font-medium text-ink-mute"
              }`}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
