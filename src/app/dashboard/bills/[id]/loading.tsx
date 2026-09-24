export default function BillProfileLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse p-4">
      {/* Back Button Skeleton */}
      <div className="h-4 w-24 bg-[#333] rounded" />

      {/* Header Profile Card Skeleton */}
      <div className="bg-[#161616] border border-[#333] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-[#222] rounded" />
          <div className="h-8 w-64 bg-[#333] rounded" />
          <div className="h-4 w-48 bg-[#222] rounded" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-4 w-20 bg-[#222] rounded sm:ml-auto" />
          <div className="h-10 w-32 bg-[#333] rounded sm:ml-auto" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-[#161616] border border-[#333] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#333] flex justify-between items-center">
          <div className="h-6 w-32 bg-[#333] rounded" />
          <div className="h-6 w-16 bg-[#222] rounded" />
        </div>
        
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-[#333] last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#333]" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-[#333] rounded" />
                  <div className="h-4 w-24 bg-[#222] rounded" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-6 w-20 bg-[#222] rounded" />
                <div className="h-8 w-24 bg-[#333] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
