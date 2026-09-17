import React from "react";

export default function BillLoading() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-5 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-4 w-28 bg-canvas-soft rounded-md" />

      {/* Bill Header Card */}
      <div className="bg-canvas border border-hairline rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-36 bg-canvas-soft rounded-lg" />
              <div className="h-5 w-16 bg-canvas-soft rounded-full" />
            </div>
            <div className="h-3.5 w-48 bg-canvas-soft rounded-md" />
          </div>
          <div className="h-8 w-20 bg-canvas-soft rounded-xl" />
        </div>

        {/* 3-metric skeleton */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4 border-t border-hairline">
          <div className="h-16 bg-canvas-soft rounded-xl" />
          <div className="h-16 bg-canvas-soft rounded-xl" />
          <div className="h-16 bg-canvas-soft rounded-xl" />
        </div>
      </div>

      {/* Splits list skeleton */}
      <div className="bg-canvas border border-hairline rounded-2xl p-4 space-y-3">
        <div className="h-4 w-28 bg-canvas-soft rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-hairline last:border-b-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-canvas-soft" />
              <div className="space-y-1">
                <div className="h-4 w-24 bg-canvas-soft rounded" />
                <div className="h-2.5 w-32 bg-canvas-soft rounded" />
              </div>
            </div>
            <div className="h-7 w-20 bg-canvas-soft rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
