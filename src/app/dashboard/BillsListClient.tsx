"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { Search, Plus, ChevronRight, FileText, CheckCircle2, Clock, X } from "lucide-react";

export default function BillsListClient({ initialBills }: { initialBills: any[] }) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "settled">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [billToDelete, setBillToDelete] = useState<{id: string, title: string} | null>(null);
  const router = useRouter();

  const totalBilled = useMemo(() => {
    return initialBills.reduce((acc, b) => acc + (b.totalAmountPaise || 0), 0);
  }, [initialBills]);

  const settledCount = useMemo(() => {
    return initialBills.filter((b) => b.status === "PAID").length;
  }, [initialBills]);

  const pendingCount = useMemo(() => {
    return initialBills.filter((b) => b.status !== "PAID").length;
  }, [initialBills]);

  const overdueCount = useMemo(() => {
    return initialBills.filter((b) => {
      if (b.status === "PAID") return false;
      const dateStr = b.date ? b.date.split("T")[0] : "2023-11-15";
      return new Date(dateStr) < new Date();
    }).length;
  }, [initialBills]);

  const totalCollected = useMemo(() => {
    return initialBills.reduce((acc, b) => b.status === "PAID" ? acc + (b.totalAmountPaise || 0) : acc, 0);
  }, [initialBills]);

  const { totalBilledChange, collectedChange, pendingDiff, overdueDiff } = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let cTotal = 0, lTotal = 0;
    let cCollected = 0, lCollected = 0;
    let cPending = 0, lPending = 0;
    let cOverdue = 0, lOverdue = 0;

    initialBills.forEach((b) => {
      const createdAt = b.createdAt ? new Date(b.createdAt) : new Date();
      const isCurrentMonth = createdAt >= currentMonthStart;
      const isLastMonth = createdAt >= lastMonthStart && createdAt < currentMonthStart;
      
      const isPaid = b.status === "PAID";
      const dateStr = b.date ? b.date.split("T")[0] : "2023-11-15";
      const isOverdue = !isPaid && new Date(dateStr) < now;

      if (isCurrentMonth) {
        cTotal += (b.totalAmountPaise || 0);
        if (isPaid) cCollected += (b.totalAmountPaise || 0);
        else cPending++;
        if (isOverdue) cOverdue++;
      } else if (isLastMonth) {
        lTotal += (b.totalAmountPaise || 0);
        if (isPaid) lCollected += (b.totalAmountPaise || 0);
        else lPending++;
        if (isOverdue) lOverdue++;
      }
    });

    const calcPct = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const diff = ((curr - prev) / prev) * 100;
      return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
    };

    return {
      totalBilledChange: calcPct(cTotal, lTotal),
      collectedChange: calcPct(cCollected, lCollected),
      pendingDiff: cPending - lPending,
      overdueDiff: cOverdue - lOverdue
    };
  }, [initialBills]);

  const filteredBills = useMemo(() => {
    let list = initialBills;
    if (filterTab === "pending") {
      list = list.filter((b) => b.status !== "PAID");
    } else if (filterTab === "settled") {
      list = list.filter((b) => b.status === "PAID");
    }

    const q = search.trim().toLowerCase();
    if (!q) return list;

    return list.filter((b) => {
      return (
        b.title.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q)) ||
        (b.totalAmountPaise / 100).toString().includes(q)
      );
    });
  }, [initialBills, search, filterTab]);

  const totalPages = Math.max(1, Math.ceil(filteredBills.length / limit));

  const paginatedBills = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredBills.slice(start, start + limit);
  }, [filteredBills, currentPage, limit]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#333] border border-[#333] rounded-xl overflow-hidden [&>*]:bg-[#161616]">
        <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-[#333]">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-4 text-[10px] md:text-xs font-bold tracking-wider">
            <FileText className="w-3.5 h-3.5" />
            TOTAL BILLS
          </div>
          <div className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{formatMoney(totalBilled)}</div>
          <div className="text-[10px] md:text-xs font-medium"><span className={totalBilledChange.startsWith('+') && totalBilledChange !== '+0.0%' && totalBilledChange !== '0%' ? 'text-green-500' : totalBilledChange === '0%' ? 'text-gray-500' : 'text-red-400'}>{totalBilledChange}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
        <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-[#333]">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-4 text-[10px] md:text-xs font-bold tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            COLLECTED
          </div>
          <div className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{formatMoney(totalCollected)}</div>
          <div className="text-[10px] md:text-xs font-medium"><span className={collectedChange.startsWith('+') && collectedChange !== '+0.0%' && collectedChange !== '0%' ? 'text-green-500' : collectedChange === '0%' ? 'text-gray-500' : 'text-red-400'}>{collectedChange}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
        <div className="hidden md:block p-6 border-b md:border-b-0 md:border-r border-[#333]">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-xs font-bold tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            PENDING BILLS
          </div>
          <div className="text-3xl font-bold text-white mb-2">{pendingCount}</div>
          <div className="text-xs font-medium"><span className={pendingDiff > 0 ? 'text-red-400' : pendingDiff < 0 ? 'text-green-500' : 'text-gray-500'}>{pendingDiff > 0 ? `+${pendingDiff}` : pendingDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
        <div className="hidden md:block p-6">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-xs font-bold tracking-wider">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            DUE ITEMS
          </div>
          <div className="text-3xl font-bold text-white mb-2">{overdueCount}</div>
          <div className="text-xs font-medium"><span className={overdueDiff > 0 ? 'text-red-400' : overdueDiff < 0 ? 'text-green-500' : 'text-gray-500'}>{overdueDiff > 0 ? `+${overdueDiff}` : overdueDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#161616] border border-[#333] rounded-xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-[#333] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Bills</h2>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-[#1a1a1a] border border-[#333] rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#a5d8ce] w-full md:w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <select 
              value={filterTab}
              onChange={(e) => setFilterTab(e.target.value as any)}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#a5d8ce] transition-colors"
            >
              <option value="all">All Bills</option>
              <option value="pending">Pending</option>
              <option value="settled">Settled</option>
            </select>
            <Link href="/dashboard/bills/new">
              <button className="bg-[#a5d8ce] text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-[#8ec2b8] transition-colors">
                <Plus size={14} />
                <span className="hidden md:inline">Add</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="w-full overflow-hidden md:overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap table-fixed md:table-auto">
            <thead className="bg-[#111111] text-[11px] font-bold text-gray-400 border-b border-[#333]">
              <tr>
                <th className="px-3 md:px-4 py-3 md:py-4 w-10 hidden md:table-cell">
                  <input type="checkbox" className="rounded border-[#333] bg-transparent text-[#a5d8ce] focus:ring-[#a5d8ce] focus:ring-offset-[#161616]" />
                </th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider w-1/2 md:w-auto truncate">Bill / Expense</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider hidden sm:table-cell">Category</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider text-right w-1/4 md:w-auto">Total</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider hidden md:table-cell">Status</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider text-right w-1/4 md:w-auto">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333] text-sm text-gray-300">
              {filteredBills.map((b) => {
                const dateStr = b.date ? b.date.split("T")[0] : "2023-11-15";
                const isPaid = b.status === "PAID";
                const isOverdue = !isPaid && new Date(dateStr) < new Date();
                
                const category = b.category || "General";
                
                return (
                  <tr 
                    key={b._id} 
                    className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, input, a')) return;
                      router.push(`/dashboard/bills/${b._id}`);
                    }}
                  >
                    <td className="px-3 md:px-4 py-3 md:py-4 hidden md:table-cell">
                      <input type="checkbox" className="rounded border-[#333] bg-transparent text-[#a5d8ce] focus:ring-[#a5d8ce] focus:ring-offset-[#161616]" />
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-white font-medium truncate">
                      <div className="flex flex-col">
                        <span className="truncate">{b.title}</span>
                        <span className="text-[10px] text-gray-500 md:hidden">{category}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-gray-400 hidden sm:table-cell">
                      {category}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 font-bold text-white text-right">
                      <div className="flex flex-col items-end">
                        <span>{formatMoney(b.totalAmountPaise)}</span>
                        <div className="md:hidden mt-0.5">
                          {isPaid ? (
                            <span className="text-[9px] font-bold text-green-400 uppercase">Settled</span>
                          ) : isOverdue ? (
                            <span className="text-[9px] font-bold text-red-400 uppercase">Due</span>
                          ) : (
                            <span className="text-[9px] font-bold text-orange-400 uppercase">Pending</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 hidden md:table-cell">
                      {isPaid ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border text-green-400 bg-green-900/30 border-green-800">
                          Settled
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border text-red-400 bg-red-900/30 border-red-800">
                          Due
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border text-orange-400 bg-orange-900/30 border-orange-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-gray-400 hidden md:table-cell">
                      {dateStr}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4">
                      <div className="flex items-center justify-end gap-3 text-gray-500">
                        <button className="hover:text-white transition-colors" title="View details" onClick={() => router.push(`/dashboard/bills/${b._id}`)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button 
                          className={`transition-colors ${isPaid ? 'opacity-30 cursor-not-allowed text-gray-600' : 'hover:text-red-400'}`} 
                          title={isPaid ? "Cannot delete settled bill" : "Delete bill"} 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPaid) return;
                            setBillToDelete({ id: b._id, title: b.title });
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {billToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f0f11]/80 backdrop-blur-sm">
          <div className="bg-[#161616] border border-[#333] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Delete Bill?</h3>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to delete <span className="font-bold text-white">{billToDelete.title}</span>? This action cannot be undone.</p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setBillToDelete(null)}
                className="flex-1 bg-[#1a1a1a] border border-[#333] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/bills/${billToDelete.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      router.refresh();
                    } else {
                      alert("Failed to delete bill");
                    }
                  } catch(err) {
                    alert("Error deleting bill");
                  } finally {
                    setBillToDelete(null);
                  }
                }}
                className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
