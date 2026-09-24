"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, Users, CreditCard, Settings, 
  LayoutDashboard, MessageCircle, User, Layers,
  ChevronRight
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  isActive: (pathname: string) => boolean;
  hasSubmenu?: boolean;
}

const dashboardItems: NavItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) => pathname === "/dashboard",
  },
];

const pagesItems: NavItem[] = [
  {
    name: "Bills",
    href: "/dashboard/bills",
    icon: FileText,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/bills"),
  },
  {
    name: "People",
    href: "/dashboard/people",
    icon: Users,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/people"),
  },
];

const settingsItems: NavItem[] = [
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

const renderNavItems = (items: NavItem[], pathname: string) => {
  return items.map((item) => {
    const active = item.isActive(pathname);
    const Icon = item.icon;

    return (
      <Link
        key={item.name}
        href={item.href}
        prefetch={true}
        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1 ${
          active
            ? "bg-[#a5d8ce] text-black"
            : "text-gray-400 hover:text-gray-200 hover:bg-[#222222]"
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className={active ? "text-black" : "text-gray-400"} />
          <span>{item.name}</span>
        </div>
        {item.hasSubmenu && <ChevronRight size={16} className="text-gray-400" />}
      </Link>
    );
  });
};

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-hide">
      <div>
        <h3 className="text-xs font-bold text-gray-500 mb-3 px-1">DASHBOARD</h3>
        {renderNavItems(dashboardItems, pathname)}
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-500 mb-3 px-1">PAGES</h3>
        {renderNavItems(pagesItems, pathname)}
      </div>
      <div>
        <h3 className="text-xs font-bold text-gray-500 mb-3 px-1">SYSTEM</h3>
        {renderNavItems(settingsItems, pathname)}
      </div>
    </nav>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const allItems = [...dashboardItems, ...pagesItems, ...settingsItems].slice(0, 4);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0c]/85 backdrop-blur-2xl border-t border-white/5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 px-2 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {allItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              className="relative flex flex-col items-center justify-center w-16 h-12 transition-all active:scale-90"
            >
              {active && (
                <span className="absolute -top-3 w-10 h-1 rounded-full bg-[#a5d8ce] shadow-[0_0_10px_rgba(165,216,206,0.8)]"></span>
              )}
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${active ? 'bg-[#a5d8ce]/10' : ''}`}>
                <Icon 
                  size={22} 
                  strokeWidth={active ? 2.5 : 2} 
                  className={`transition-all duration-300 ${active ? "text-[#a5d8ce] scale-110" : "text-gray-500"}`} 
                />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-wide font-medium transition-colors ${active ? "text-[#a5d8ce]" : "text-gray-500"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
