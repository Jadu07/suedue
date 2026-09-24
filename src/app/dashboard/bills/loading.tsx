export default function BillsLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#161616] border border-[#333] rounded-xl p-6">
        <div className="h-6 w-32 rounded bg-[#333]" />
        <div className="h-4 w-40 rounded bg-[#222]" />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-0 bg-[#161616] border border-[#333] rounded-xl overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-6 border-b md:border-b-0 md:border-r border-[#333] last:border-r-0">
            <div className="h-4 w-32 rounded bg-[#333] mb-4" />
            <div className="h-8 w-24 rounded bg-[#222] mb-2" />
            <div className="h-3 w-40 rounded bg-[#222]" />
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="bg-[#161616] border border-[#333] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#333] flex justify-between items-center">
          <div className="h-6 w-24 rounded bg-[#333]" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-64 rounded bg-[#222]" />
            <div className="h-10 w-10 rounded bg-[#222]" />
            <div className="h-10 w-10 rounded bg-[#222]" />
            <div className="h-10 w-24 rounded bg-[#222]" />
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-[#333] last:border-b-0">
              <div className="flex items-center gap-4">
                <div className="h-4 w-4 rounded bg-[#333]" />
                <div className="h-5 w-40 rounded bg-[#222]" />
                <div className="h-5 w-24 rounded bg-[#222] hidden md:block" />
              </div>
              <div className="h-5 w-20 rounded bg-[#222] hidden md:block" />
              <div className="h-5 w-24 rounded bg-[#222]" />
              <div className="h-6 w-16 rounded-full bg-[#222]" />
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded bg-[#222]" />
                <div className="w-8 h-8 rounded bg-[#222]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
