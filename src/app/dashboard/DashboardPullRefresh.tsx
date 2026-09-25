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
        className="pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 rounded-full border border-[#333] bg-[#161616] shadow-xl flex items-center justify-center transition-all duration-200" 
        style={{ 
          top: `${refreshing ? '2rem' : '-1rem'}`,
          opacity: refreshing || distance > 10 ? 1 : 0,
          padding: '8px',
          transform: `translateX(-50%) ${refreshing ? 'scale(1)' : `scale(${Math.max(0.5, Math.min(1, distance / 64))})`}`
        }}
      >
        <Loader2 
          className={`h-5 w-5 text-[#a5d8ce] ${refreshing ? "animate-spin" : ""}`} 
          style={{ transform: refreshing ? 'none' : `rotate(${distance * 3}deg)` }} 
        />
      </div>
      {children}
    </div>
  );
}
