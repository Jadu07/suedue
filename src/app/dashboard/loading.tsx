import React from "react";

export default function DashboardLoading() {
  return (
    <div className="p-md md:p-huge max-w-5xl mx-auto space-y-md animate-pulse">
      {/* Header skeleton */}
      <div className="hidden md:flex justify-between items-center gap-md">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-canvas-soft rounded-lg" />
          <div className="h-3.5 w-64 bg-canvas-soft rounded-md" />
        </div>
        <div className="h-9 w-28 bg-canvas-soft rounded-xl" />
      </div>

      {/* Mobile action button skeleton */}
      <div className="md:hidden h-10 w-full bg-canvas-soft rounded-xl" />

      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-2 sm:gap-sm">
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl space-y-2">
          <div className="h-2.5 w-16 bg-canvas-soft rounded" />
          <div className="h-6 w-20 bg-canvas-soft rounded-md" />
        </div>
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl space-y-2">
          <div className="h-2.5 w-16 bg-canvas-soft rounded" />
          <div className="h-6 w-20 bg-canvas-soft rounded-md" />
        </div>
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl space-y-2">
          <div className="h-2.5 w-16 bg-canvas-soft rounded" />
          <div className="h-6 w-20 bg-canvas-soft rounded-md" />
        </div>
      </div>

      {/* Search and filter skeleton */}
      <div className="h-10 w-full bg-canvas-soft rounded-xl" />

      {/* Content list skeleton */}
      <div className="space-y-2">
        <div className="h-20 bg-canvas border border-hairline rounded-2xl p-4" />
        <div className="h-20 bg-canvas border border-hairline rounded-2xl p-4" />
        <div className="h-20 bg-canvas border border-hairline rounded-2xl p-4" />
      </div>
    </div>
  );
}
