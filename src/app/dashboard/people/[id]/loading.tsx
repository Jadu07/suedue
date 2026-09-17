import React from "react";

export default function PersonDetailsLoading() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-4 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-28 bg-canvas-soft rounded-md" />

      {/* Person Profile Hero Card */}
      <div className="bg-canvas border border-hairline rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-canvas-soft shrink-0" />
            <div className="space-y-2">
              <div className="h-5 w-36 bg-canvas-soft rounded-lg" />
              <div className="h-3.5 w-28 bg-canvas-soft rounded-md" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-9 w-24 bg-canvas-soft rounded-xl" />
            <div className="h-9 w-28 bg-canvas-soft rounded-xl" />
          </div>
        </div>

        {/* 2 or 3 quick balance pills */}
        <div className="pt-3 border-t border-hairline flex items-center justify-between">
          <div className="h-3 w-28 bg-canvas-soft rounded" />
          <div className="h-5 w-20 bg-canvas-soft rounded-md" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="grid grid-cols-4 bg-canvas-soft border border-hairline p-1 rounded-xl gap-1 h-10" />

      {/* Tab Content Cards Skeleton */}
      <div className="space-y-2.5 pt-2">
        <div className="flex justify-between items-center px-1">
          <div className="h-3 w-24 bg-canvas-soft rounded" />
          <div className="h-3 w-16 bg-canvas-soft rounded" />
        </div>

        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-canvas border border-hairline rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-md bg-canvas-soft" />
                <div className="space-y-1">
                  <div className="h-4 w-32 bg-canvas-soft rounded" />
                  <div className="h-2.5 w-20 bg-canvas-soft rounded" />
                </div>
              </div>
              <div className="h-5 w-16 bg-canvas-soft rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
