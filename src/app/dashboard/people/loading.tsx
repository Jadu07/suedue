import React from "react";

export default function PeopleLoading() {
  return (
    <div className="p-md md:p-huge max-w-5xl mx-auto space-y-md md:space-y-lg animate-pulse">
      {/* Desktop Header Skeleton */}
      <div className="hidden md:flex justify-between items-center gap-md">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-canvas-soft rounded-xl" />
          <div className="h-3.5 w-72 bg-canvas-soft rounded-md" />
        </div>
        <div className="h-10 w-32 bg-canvas-soft rounded-xl" />
      </div>

      {/* Mobile Action Button Skeleton */}
      <div className="md:hidden h-10 w-full bg-canvas-soft rounded-xl" />

      {/* 3-Metric Overview Skeleton */}
      <div className="grid grid-cols-3 gap-2 sm:gap-sm">
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl space-y-2">
          <div className="h-2.5 w-16 bg-canvas-soft rounded" />
          <div className="h-6 w-20 bg-canvas-soft rounded-md" />
        </div>
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl space-y-2">
          <div className="h-2.5 w-16 bg-canvas-soft rounded" />
          <div className="h-6 w-16 bg-canvas-soft rounded-md" />
        </div>
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl space-y-2">
          <div className="h-2.5 w-16 bg-canvas-soft rounded" />
          <div className="h-6 w-14 bg-canvas-soft rounded-md" />
        </div>
      </div>

      {/* Search & Tabs Skeleton */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="h-9 flex-1 bg-canvas-soft rounded-xl" />
        <div className="h-9 w-full sm:w-56 bg-canvas-soft rounded-xl" />
      </div>

      {/* Mobile Person Cards Skeleton (md:hidden) */}
      <div className="md:hidden space-y-2.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-canvas border border-hairline rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-canvas-soft shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <div className="h-4 w-28 bg-canvas-soft rounded" />
                  <div className="h-3 w-24 bg-canvas-soft rounded" />
                </div>
              </div>
              <div className="w-6 h-6 rounded-lg bg-canvas-soft shrink-0" />
            </div>
            <div className="pt-2 border-t border-hairline flex justify-between items-center">
              <div className="h-2.5 w-14 bg-canvas-soft rounded" />
              <div className="h-4 w-16 bg-canvas-soft rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Skeleton (hidden on mobile) */}
      <div className="hidden md:block bg-canvas border border-hairline rounded-xl p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-hairline last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-canvas-soft" />
              <div className="space-y-1">
                <div className="h-3.5 w-32 bg-canvas-soft rounded" />
                <div className="h-2.5 w-24 bg-canvas-soft rounded" />
              </div>
            </div>
            <div className="h-4 w-20 bg-canvas-soft rounded" />
            <div className="h-6 w-16 bg-canvas-soft rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
