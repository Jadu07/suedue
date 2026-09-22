"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function DashboardPullRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const startY = useRef<number | null>(null);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (event: React.TouchEvent) => {
    if (window.scrollY === 0 && !refreshing) startY.current = event.touches[0].clientY;
  };

  const onTouchMove = (event: React.TouchEvent) => {
    if (startY.current === null || refreshing) return;
    const pulled = Math.max(0, Math.min(92, event.touches[0].clientY - startY.current));
    if (pulled > 0) event.preventDefault();
    setDistance(pulled);
  };

  const onTouchEnd = () => {
    if (startY.current === null) return;
    const shouldRefresh = distance >= 64;
    startY.current = null;
    setDistance(0);
    if (!shouldRefresh) return;
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 700);
  };

  return (
    <div className="relative min-h-full overscroll-y-contain" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div aria-hidden="true" className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.5rem)] z-50 -translate-x-1/2 rounded-full border border-hairline bg-canvas px-3 py-1.5 text-[10px] font-bold text-ink-mute shadow-sm transition-opacity" style={{ opacity: refreshing || distance > 0 ? 1 : 0 }}>
        <RefreshCw className={`mr-1 inline h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
        {refreshing ? "Refreshing…" : distance >= 64 ? "Release to refresh" : "Pull to refresh"}
      </div>
      {children}
    </div>
  );
}
