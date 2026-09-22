export default function DashboardLoading() {
  return (
    <div className="p-3 sm:p-md md:p-huge animate-pulse space-y-md">
      <div className="h-8 w-32 rounded-lg bg-canvas-soft" />
      <div className="grid grid-cols-3 gap-2 sm:gap-sm">
        <div className="h-20 rounded-xl border border-hairline bg-canvas-soft" />
        <div className="h-20 rounded-xl border border-hairline bg-canvas-soft" />
        <div className="h-20 rounded-xl border border-hairline bg-canvas-soft" />
      </div>
      <div className="h-11 w-full rounded-xl border border-hairline bg-canvas-soft" />
      <div className="space-y-2">
        <div className="h-20 rounded-xl border border-hairline bg-canvas-soft" />
        <div className="h-20 rounded-xl border border-hairline bg-canvas-soft" />
        <div className="h-20 rounded-xl border border-hairline bg-canvas-soft" />
      </div>
    </div>
  );
}
