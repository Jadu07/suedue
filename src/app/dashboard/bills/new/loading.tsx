export default function NewBillLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between bg-[#161616] border border-[#333] rounded-xl p-6">
        <div className="h-6 w-32 rounded bg-[#333]" />
        <div className="h-4 w-40 rounded bg-[#222]" />
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#161616] border border-[#333] rounded-xl p-6 space-y-6">
          <div className="h-5 w-48 rounded bg-[#333] mb-4" />
          <div className="h-12 w-full rounded bg-[#222]" />
          <div className="h-12 w-full rounded bg-[#222]" />
          <div className="h-24 w-full rounded bg-[#222]" />
        </div>
        <div className="bg-[#161616] border border-[#333] rounded-xl p-6 space-y-6">
          <div className="h-5 w-48 rounded bg-[#333] mb-4" />
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#222]" />
            <div className="h-10 w-full rounded bg-[#222]" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#222]" />
            <div className="h-10 w-full rounded bg-[#222]" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#222]" />
            <div className="h-10 w-full rounded bg-[#222]" />
          </div>
          <div className="h-12 w-full rounded-lg bg-[#a5d8ce]/50 mt-6" />
        </div>
      </div>
    </div>
  );
}
