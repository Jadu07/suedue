import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { DesktopNav, MobileBottomNav } from "./DashboardNav";
import DashboardPullRefresh from "./DashboardPullRefresh";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-canvas flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center p-lg pt-[calc(1rem+env(safe-area-inset-top))] border-b border-hairline bg-canvas/95 backdrop-blur-md sticky top-0 z-20">
        <Link href="/dashboard" className="display-md font-black text-primary tracking-tight lowercase">suedue</Link>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 bg-canvas-soft border-r border-hairline md:flex flex-col h-screen sticky top-0">
        <div className="p-xl border-b border-hairline">
          <Link href="/dashboard" className="display-md font-black text-primary tracking-tight lowercase">suedue</Link>
        </div>
        
        <DesktopNav />
        
        <div className="p-lg border-t border-hairline">
          <LogoutButton
            className="w-full flex items-center gap-md px-md py-sm rounded-md text-ink-mute hover:text-ink transition-colors text-xs font-semibold"
            iconSize={18}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-0 flex-1 overflow-visible bg-canvas pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
        <DashboardPullRefresh>{children}</DashboardPullRefresh>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
}
