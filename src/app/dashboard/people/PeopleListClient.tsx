"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatMoney } from "@/lib/money";
import PersonActions from "./PersonActions";
import UserAvatar from "@/components/UserAvatar";
import { 
  Search, 
  UserPlus, 
  Phone, 
  ChevronRight, 
  X,
  Users
} from "lucide-react";

export interface PersonItem {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  isActive: boolean;
  pendingPaise: number;
  unpaidBillsCount: number;
  paidBillsCount: number;
  activeRequest?: {
    id: string;
    refCode: string;
    link: string;
    amountPaise: number;
    expiresAt: string;
  } | null;
  createdAt: string;
}

export default function PeopleListClient({ initialPeople }: { initialPeople: PersonItem[] }) {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") || "";
  const [search, setSearch] = useState(initialSearch);
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "settled">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [personToDelete, setPersonToDelete] = useState<{id: string, name: string} | null>(null);
  const router = useRouter();

  // Live filter & search
  const filteredPeople = useMemo(() => {
    let result = initialPeople;

    if (filterTab === "pending") {
      result = result.filter((p) => p.pendingPaise > 0);
    } else if (filterTab === "settled") {
      result = result.filter((p) => p.pendingPaise === 0);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((p) => {
        const name = p.name.toLowerCase();
        const phone = p.phone.toLowerCase();
        const email = (p.email || "").toLowerCase();
        return name.includes(q) || phone.includes(q) || email.includes(q);
      });
    }

    return result;
  }, [initialPeople, search, filterTab]);

  const totalPages = Math.max(1, Math.ceil(filteredPeople.length / limit));

  const paginatedPeople = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredPeople.slice(start, start + limit);
  }, [filteredPeople, currentPage, limit]);

  // Aggregate metrics
  const { 
    totalPeopleCount, peopleDiff, 
    totalOutstandingPaise, outstandingDiff,
    settledPeopleCount, settledDiff,
    pendingReminders, remindersDiff 
  } = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let cPeople = 0, lPeople = 0;
    let cOut = 0, lOut = 0;
    let cSettled = 0, lSettled = 0;
    let cRem = 0, lRem = 0;

    const totalPeople = initialPeople.length;
    const totalOut = initialPeople.reduce((acc, p) => acc + (p.pendingPaise || 0), 0);
    const totalSet = initialPeople.filter((p) => p.pendingPaise === 0).length;
    const totalRem = initialPeople.filter(p => p.activeRequest).length;

    initialPeople.forEach(p => {
      const createdAt = p.createdAt ? new Date(p.createdAt) : new Date();
      if (createdAt >= currentMonthStart) {
        cPeople++;
        if (p.pendingPaise > 0) cOut += p.pendingPaise;
        if (p.pendingPaise === 0) cSettled++;
        if (p.activeRequest) cRem++;
      } else if (createdAt >= lastMonthStart && createdAt < currentMonthStart) {
        lPeople++;
        if (p.pendingPaise > 0) lOut += p.pendingPaise;
        if (p.pendingPaise === 0) lSettled++;
        if (p.activeRequest) lRem++;
      }
    });

    const calcPct = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const diff = ((curr - prev) / prev) * 100;
      return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
    };

    return {
      totalPeopleCount: totalPeople,
      peopleDiff: cPeople - lPeople,
      totalOutstandingPaise: totalOut,
      outstandingDiff: calcPct(cOut, lOut),
      settledPeopleCount: totalSet,
      settledDiff: cSettled - lSettled,
      pendingReminders: totalRem,
      remindersDiff: cRem - lRem
    };
  }, [initialPeople]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#333] border border-[#333] rounded-xl overflow-hidden [&>*]:bg-[#161616]">
        <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-[#333]">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-4 text-[10px] md:text-xs font-bold tracking-wider">
            <Users className="w-3.5 h-3.5" />
            ACTIVE MEMBERS
          </div>
          <div className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{totalPeopleCount}</div>
          <div className="text-[10px] md:text-xs font-medium"><span className={peopleDiff > 0 ? 'text-green-500' : peopleDiff < 0 ? 'text-red-400' : 'text-gray-500'}>{peopleDiff > 0 ? `+${peopleDiff}` : peopleDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
        <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-[#333]">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-4 text-[10px] md:text-xs font-bold tracking-wider">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            TOTAL OUTSTANDING
          </div>
          <div className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{formatMoney(totalOutstandingPaise)}</div>
          <div className="text-[10px] md:text-xs font-medium"><span className={outstandingDiff.startsWith('+') && outstandingDiff !== '+0.0%' && outstandingDiff !== '0%' ? 'text-green-500' : outstandingDiff === '0%' ? 'text-gray-500' : 'text-red-400'}>{outstandingDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
        <div className="hidden md:block p-6 border-b md:border-b-0 md:border-r border-[#333]">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-xs font-bold tracking-wider">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            SETTLED MEMBERS
          </div>
          <div className="text-3xl font-bold text-white mb-2">{settledPeopleCount}</div>
          <div className="text-xs font-medium"><span className={settledDiff > 0 ? 'text-green-500' : settledDiff < 0 ? 'text-red-400' : 'text-gray-500'}>{settledDiff > 0 ? `+${settledDiff}` : settledDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
        <div className="hidden md:block p-6">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-xs font-bold tracking-wider">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            PENDING REMINDERS
          </div>
          <div className="text-3xl font-bold text-white mb-2">{pendingReminders}</div>
          <div className="text-xs font-medium"><span className={remindersDiff > 0 ? 'text-red-400' : remindersDiff < 0 ? 'text-green-500' : 'text-gray-500'}>{remindersDiff > 0 ? `+${remindersDiff}` : remindersDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#161616] border border-[#333] rounded-xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-[#333] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">People</h2>
          
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
              <option value="all">All People</option>
              <option value="pending">Pending Dues</option>
              <option value="settled">Settled</option>
            </select>
            <Link href="/dashboard/people/new">
              <button className="bg-[#a5d8ce] text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-[#8ec2b8] transition-colors">
                <UserPlus size={14} />
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
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider w-12 hidden md:table-cell">Avatar</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider w-1/2 md:w-auto truncate">Group Member</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider hidden md:table-cell">Email Address</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider text-right w-1/4 md:w-auto">Balance</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider hidden lg:table-cell">WhatsApp</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider text-right w-1/4 md:w-auto">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333] text-sm text-gray-300">
              {filteredPeople.map((p) => {
                const owesMoney = p.pendingPaise > 0;
                
                return (
                  <tr 
                    key={p.id} 
                    className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, input, a')) return;
                      router.push(`/dashboard/people/${p.id}`);
                    }}
                  >
                    <td className="px-3 md:px-4 py-3 md:py-4 hidden md:table-cell">
                      <input type="checkbox" className="rounded border-[#333] bg-transparent text-[#a5d8ce] focus:ring-[#a5d8ce] focus:ring-offset-[#161616]" />
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 hidden md:table-cell">
                      <img src={`https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(p.name)}`} alt="avatar" className="w-8 h-8 rounded-full border border-[#333] bg-[#1a1a1a]" />
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-white font-medium truncate">
                      <div className="flex items-center gap-2">
                        <img src={`https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(p.name)}`} alt="avatar" className="w-6 h-6 rounded-full border border-[#333] bg-[#1a1a1a] md:hidden" />
                        <span className="truncate">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-gray-500 italic hidden md:table-cell">
                      {p.email || "Unknown"}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 font-bold text-white text-right">
                      {formatMoney(p.pendingPaise)}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 hidden sm:table-cell">
                      {owesMoney ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border text-orange-400 bg-orange-900/30 border-orange-800">
                          Owes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border text-green-400 bg-green-900/30 border-green-800">
                          Settled
                        </span>
                      )}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-gray-400 hidden lg:table-cell">
                      {p.phone}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4">
                      <div className="flex items-center justify-end gap-3 text-gray-500">
                        <button className="hover:text-white transition-colors" title="View details" onClick={() => router.push(`/dashboard/people/${p.id}`)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button className="hover:text-red-400 transition-colors" title="Delete person" onClick={(e) => {
                          e.stopPropagation();
                          setPersonToDelete({ id: p.id, name: p.name });
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPeople.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No people found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Popup */}
      {personToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f0f11]/80 backdrop-blur-sm">
          <div className="bg-[#161616] border border-[#333] rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-white mb-2">Delete Person?</h3>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to delete <span className="font-bold text-white">{personToDelete.name}</span>? This action cannot be undone.</p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setPersonToDelete(null)}
                className="flex-1 bg-[#1a1a1a] border border-[#333] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/people/${personToDelete.id}`, { method: 'DELETE' });
                    if (res.ok) {
                      router.refresh();
                    } else {
                      alert("Failed to delete person");
                    }
                  } catch(err) {
                    alert("Error deleting person");
                  } finally {
                    setPersonToDelete(null);
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
