"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DesktopNav, MobileBottomNav } from "./DashboardNav";
import DashboardPullRefresh from "./DashboardPullRefresh";
import GlobalSearch from "./GlobalSearch";

export default function DashboardLayoutClient({ 
  children, 
  adminName 
}: { 
  children: React.ReactNode;
  adminName: string;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#0f0f11] flex flex-col md:flex-row text-gray-100 font-sans">
      <header className="md:hidden flex items-center justify-between px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top))] border-b border-[#333] bg-[#111111]/90 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
        <Link href="/dashboard" className="text-xl font-black tracking-widest lowercase flex items-center gap-2 text-white">
          suedue
        </Link>
        <Link href="/dashboard/settings" className="hover:opacity-80 transition active:scale-95">
          <img src={`https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(adminName)}`} alt={adminName} className="w-8 h-8 rounded-full border border-[#333] bg-[#1a1a1a] shadow-sm" />
        </Link>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 bg-[#161616] border-r border-[#333] md:flex flex-col h-screen sticky top-0 shrink-0">
        <div className="p-6 flex items-center justify-start">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="font-black text-xl tracking-widest lowercase text-white">suedue</div>
          </Link>
        </div>
        
        <DesktopNav />
      </aside>

      {/* Main Content */}
      <main className="min-h-0 flex-1 overflow-visible bg-[#0f0f11] pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0 flex flex-col h-screen overflow-y-auto">
        {/* Top Header */}
        <div className="hidden md:flex h-16 items-center justify-between px-6 border-b border-[#333] shrink-0 sticky top-0 bg-[#0f0f11]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4 flex-1">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings" className="hover:opacity-80 transition">
              <img src={`https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(adminName)}`} alt={adminName} className="w-8 h-8 rounded-full border border-[#333] bg-[#1a1a1a]" />
            </Link>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-6">
          <DashboardPullRefresh>{children}</DashboardPullRefresh>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
}
