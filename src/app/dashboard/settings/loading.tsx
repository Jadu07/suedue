export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#161616] border border-[#333] rounded-xl p-6">
        <div className="h-6 w-32 rounded bg-[#333]" />
        <div className="h-4 w-40 rounded bg-[#222]" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#161616] border border-[#333] rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#333] flex justify-between items-center">
              <div>
                <div className="h-5 w-40 rounded bg-[#333] mb-2" />
                <div className="h-4 w-64 rounded bg-[#222]" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-24 rounded bg-[#333]" />
                <div className="h-10 w-full rounded bg-[#222]" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-[#333]" />
                <div className="h-10 w-full rounded bg-[#222]" />
              </div>
              <div className="pt-4 flex justify-end">
                <div className="h-10 w-32 rounded bg-[#333]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
