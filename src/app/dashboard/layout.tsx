import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { DesktopNav, MobileBottomNav } from "./DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-lg border-b border-hairline bg-canvas sticky top-0 z-10">
        <Link href="/dashboard" className="display-md font-black text-primary tracking-tight lowercase">suedue</Link>
        <LogoutButton
          className="text-ink-mute hover:text-ink transition-colors flex items-center justify-center p-1"
          showText={false}
          iconSize={20}
        />
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
      <main className="flex-1 overflow-auto bg-canvas pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </div>
  );
}
