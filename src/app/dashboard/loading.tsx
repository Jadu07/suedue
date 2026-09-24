export default function DashboardOverviewLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="mb-8">
        <div className="h-8 w-64 rounded bg-[#333] mb-2" />
        <div className="h-4 w-96 rounded bg-[#222]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#161616] border border-[#333] p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-32 rounded bg-[#333]" />
              <div className="h-4 w-4 rounded bg-[#333]" />
            </div>
            <div className="h-8 w-24 rounded bg-[#222] mb-2" />
            <div className="h-4 w-24 rounded bg-[#222]" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-[#161616] border border-[#333] rounded-xl p-6">
          <div className="h-6 w-64 rounded bg-[#333] mb-6" />
          <div className="h-64 border-b border-[#333] flex items-end justify-between px-2 pb-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="w-10 rounded-t-sm bg-[#333]" style={{ height: `${20 + i * 10}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-3 w-8 rounded bg-[#222]" />
            ))}
          </div>
        </div>
        
        <div className="bg-[#161616] border border-[#333] rounded-xl p-6">
          <div className="h-6 w-40 rounded bg-[#333] mb-6" />
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start justify-between">
                <div>
                  <div className="h-4 w-32 rounded bg-[#333] mb-2" />
                  <div className="h-3 w-24 rounded bg-[#222]" />
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="h-4 w-16 rounded bg-[#333] mb-2" />
                  <div className="h-3 w-24 rounded bg-[#222]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
