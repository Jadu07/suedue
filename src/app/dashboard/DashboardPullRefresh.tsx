"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

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
      <div 
        aria-hidden="true" 
        className="md:hidden pointer-events-none fixed left-0 right-0 z-[100] flex justify-center transition-all duration-200" 
        style={{ 
          top: `calc(env(safe-area-inset-top) + 4rem + ${refreshing ? '1rem' : '-2rem'})`,
          opacity: refreshing || distance > 10 ? 1 : 0
        }}
      >
        <div 
          className="rounded-full border border-[#333] bg-[#161616] shadow-2xl flex items-center justify-center"
          style={{
            padding: '6px',
            transform: `${refreshing ? 'scale(1)' : `scale(${Math.max(0.5, Math.min(1, distance / 64))})`}`
          }}
        >
          <Loader2 
            className={`h-4 w-4 text-[#a5d8ce] ${refreshing ? "animate-spin" : ""}`} 
            style={{ transform: refreshing ? 'none' : `rotate(${distance * 3}deg)` }} 
          />
        </div>
      </div>
      {children}
    </div>
  );
}
