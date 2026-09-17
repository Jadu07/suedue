import React from "react";

export default function PaymentsLoading() {
  return (
    <div className="p-md md:p-huge max-w-5xl mx-auto space-y-md md:space-y-lg animate-pulse">
      <div className="hidden md:flex justify-between items-center gap-md">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-canvas-soft rounded-xl" />
          <div className="h-3.5 w-64 bg-canvas-soft rounded-md" />
        </div>
      </div>

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

      <div className="h-9 w-full bg-canvas-soft rounded-xl" />

      {/* Payment cards skeleton */}
      <div className="space-y-2.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-canvas border border-hairline rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-28 bg-canvas-soft rounded" />
                <div className="h-3 w-36 bg-canvas-soft rounded" />
              </div>
              <div className="h-5 w-20 bg-canvas-soft rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
