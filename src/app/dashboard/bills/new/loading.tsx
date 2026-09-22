export default function NewBillLoading() {
  return (
    <div className="p-3 sm:p-md md:p-huge max-w-2xl mx-auto space-y-md animate-pulse">
      <div className="h-4 w-24 rounded bg-canvas-soft" />
      <div className="rounded-2xl border border-hairline bg-canvas p-4 space-y-2">
        <div className="h-6 w-40 rounded bg-canvas-soft" />
        <div className="h-3 w-64 max-w-full rounded bg-canvas-soft" />
      </div>
      <div className="rounded-2xl border border-hairline bg-canvas p-4 space-y-4">
        <div className="h-11 rounded-xl bg-canvas-soft" />
        <div className="h-11 rounded-xl bg-canvas-soft" />
        <div className="h-11 rounded-xl bg-canvas-soft" />
      </div>
      <div className="rounded-2xl border border-hairline bg-canvas p-4 space-y-4">
        <div className="h-5 w-36 rounded bg-canvas-soft" />
        <div className="h-24 rounded-xl bg-canvas-soft" />
        <div className="h-12 rounded-xl bg-canvas-soft" />
      </div>
    </div>
  );
}
