"use client";

import { useState, useMemo } from "react";
import { formatMoney } from "@/lib/money";
import { Search, Copy, Check, Info, RefreshCw, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentsClient({ initialPayments }: { initialPayments: any[] }) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const router = useRouter();

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/payments/verify", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Synced successfully! ${data.verifiedCount || 0} new payment(s) verified.`);
        router.refresh();
      } else {
        setSyncMessage(data.error || "Sync failed");
      }
    } catch (err: any) {
      setSyncMessage("Error connecting to verifier");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  // Live client-side search across Person, Bill, UTR, Token, and Amount
  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return initialPayments.filter((p) => {
      // Filter by tab method
      if (filterTab === "fampay" && p.method !== "fampay") return false;
      if (filterTab === "manual" && p.method !== "manual" && p.method !== "cash") return false;

      if (!q) return true;

      const personName = (p.personId?.name || "").toLowerCase();
      const billTitle = (p.billId?.title || "").toLowerCase();
      const utr = (p.utr || "").toLowerCase();
      const refCode = (p.refCode || "").toLowerCase();
      const sender = (p.senderName || "").toLowerCase();
      const amountStr = (p.amountPaise / 100).toString();
      return (
        personName.includes(q) ||
        billTitle.includes(q) ||
        utr.includes(q) ||
        refCode.includes(q) ||
        sender.includes(q) ||
        amountStr.includes(q)
      );
    });
  }, [initialPayments, search, filterTab]);

  const { 
    totalVolume, volumeDiff,
    fampaySyncs, syncsDiff,
    manualRecords, manualDiff,
    successRate, successDiff
  } = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    let cVol = 0, lVol = 0;
    let cSyncs = 0, lSyncs = 0;
    let cMan = 0, lMan = 0;
    let cSucc = 0, lSucc = 0;
    let cTotal = 0, lTotal = 0;

    const tVol = initialPayments.reduce((acc, p) => p.status === "VERIFIED" ? acc + (p.amountPaise || 0) : acc, 0);
    const tSync = initialPayments.filter(p => p.method === "fampay").length;
    const tMan = initialPayments.filter(p => p.method === "manual").length;
    const tSucc = initialPayments.length > 0 ? (initialPayments.filter(p => p.status === "VERIFIED").length / initialPayments.length) * 100 : 100;

    initialPayments.forEach(p => {
      const createdAt = p.createdAt ? new Date(p.createdAt) : new Date();
      if (createdAt >= currentMonthStart) {
        cTotal++;
        if (p.status === "VERIFIED") {
          cVol += (p.amountPaise || 0);
          cSucc++;
        }
        if (p.method === "fampay") cSyncs++;
        if (p.method === "manual") cMan++;
      } else if (createdAt >= lastMonthStart && createdAt < currentMonthStart) {
        lTotal++;
        if (p.status === "VERIFIED") {
          lVol += (p.amountPaise || 0);
          lSucc++;
        }
        if (p.method === "fampay") lSyncs++;
        if (p.method === "manual") lMan++;
      }
    });

    const calcPct = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? "+100%" : "0%";
      const diff = ((curr - prev) / prev) * 100;
      return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
    };

    const cRate = cTotal > 0 ? (cSucc / cTotal) * 100 : 100;
    const lRate = lTotal > 0 ? (lSucc / lTotal) * 100 : 100;
    const rateDiff = cRate - lRate;

    return {
      totalVolume: tVol, volumeDiff: calcPct(cVol, lVol),
      fampaySyncs: tSync, syncsDiff: cSyncs - lSyncs,
      manualRecords: tMan, manualDiff: cMan - lMan,
      successRate: tSucc.toFixed(1) + "%", 
      successDiff: rateDiff > 0 ? `+${rateDiff.toFixed(1)}%` : `${rateDiff.toFixed(1)}%`
    };
  }, [initialPayments]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#333] border border-[#333] rounded-xl overflow-hidden [&>*]:bg-[#161616]">
        <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-[#333]">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-4 text-[10px] md:text-xs font-bold tracking-wider truncate">
            <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            <span className="truncate">TOTAL VOLUME</span>
          </div>
          <div className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2 truncate">{formatMoney(totalVolume)}</div>
          <div className="text-[10px] md:text-xs font-medium"><span className={volumeDiff.startsWith('+') && volumeDiff !== '+0.0%' && volumeDiff !== '0%' ? 'text-green-500' : volumeDiff === '0%' ? 'text-gray-500' : 'text-red-400'}>{volumeDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
        <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-[#333]">
          <div className="flex items-center gap-2 text-gray-400 mb-2 md:mb-4 text-[10px] md:text-xs font-bold tracking-wider truncate">
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">FAMPAY SYNCS</span>
          </div>
          <div className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">{fampaySyncs}</div>
          <div className="text-[10px] md:text-xs font-medium"><span className={syncsDiff > 0 ? 'text-green-500' : syncsDiff < 0 ? 'text-red-400' : 'text-gray-500'}>{syncsDiff > 0 ? `+${syncsDiff}` : syncsDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
        <div className="hidden md:block p-6 border-b md:border-b-0 md:border-r border-[#333]">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-xs font-bold tracking-wider truncate">
            <svg className="shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span className="truncate">MANUAL RECORDS</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{manualRecords}</div>
          <div className="text-xs font-medium"><span className={manualDiff > 0 ? 'text-green-500' : manualDiff < 0 ? 'text-red-400' : 'text-gray-500'}>{manualDiff > 0 ? `+${manualDiff}` : manualDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
        <div className="hidden md:block p-6">
          <div className="flex items-center gap-2 text-gray-400 mb-4 text-xs font-bold tracking-wider truncate">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">SUCCESS RATE</span>
          </div>
          <div className="text-3xl font-bold text-white mb-2">{successRate}</div>
          <div className="text-xs font-medium"><span className={successDiff.startsWith('+') && successDiff !== '+0.0%' && successDiff !== '0.0%' ? 'text-green-500' : successDiff === '0.0%' ? 'text-gray-500' : 'text-red-400'}>{successDiff}</span> <span className="text-gray-500">vs last month</span></div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[#161616] border border-[#333] rounded-xl overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-[#333] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Payments</h2>
          
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
              onChange={(e) => setFilterTab(e.target.value)}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-[#a5d8ce] transition-colors"
            >
              <option value="all">All Methods</option>
              <option value="fampay">FamPay Sync</option>
              <option value="manual">Manual Entry</option>
            </select>
            <button 
              onClick={handleSyncNow}
              disabled={syncing}
              className="bg-[#a5d8ce] text-black px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-[#8ec2b8] transition-colors"
            >
              <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
              <span className="hidden md:inline">{syncing ? "Syncing..." : "Sync"}</span>
            </button>
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
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider hidden md:table-cell">Transaction ID</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider w-1/2 md:w-auto truncate">Payer</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider text-right w-1/4 md:w-auto">Amount</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider hidden sm:table-cell">Method</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider hidden lg:table-cell">Timestamp</th>
                <th className="px-3 md:px-4 py-3 md:py-4 uppercase tracking-wider text-right w-1/4 md:w-auto">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333] text-sm text-gray-300">
              {filteredPayments.map((p, idx) => {
                const dt = new Date(p.paymentTime || p.createdAt);
                const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const fullDateStr = dt.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-");
                const timeStr = dt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
                
                // Mock Transaction ID if not present
                const txnId = p.utr || p.refCode || `TXN-9842₹{idx}`;
                const method = p.method === "fampay" ? "FamPay" : p.method === "cash" ? "Cash" : "UPI";
                const methodColor = method === "FamPay" ? "text-blue-400 bg-blue-900/30 border-blue-800" 
                                  : method === "Cash" ? "text-green-400 bg-green-900/30 border-green-800"
                                  : "text-purple-400 bg-purple-900/30 border-purple-800";

                return (
                  <tr key={p._id.toString()} className="hover:bg-[#1a1a1a] transition-colors cursor-pointer" onClick={() => setSelectedPayment(p)}>
                    <td className="px-3 md:px-4 py-3 md:py-4 hidden md:table-cell" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-[#333] bg-transparent text-[#a5d8ce] focus:ring-[#a5d8ce] focus:ring-offset-[#161616]" />
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 font-mono font-medium text-white hidden md:table-cell">
                      {txnId}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-white truncate">
                      <div className="flex flex-col">
                        <span className="truncate">{p.personId?.name || p.senderName || "Unknown"}</span>
                        <span className="text-[10px] text-gray-500 font-mono md:hidden truncate max-w-[100px]">{txnId}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 font-bold text-white text-right">
                      <div className="flex flex-col items-end">
                        <span>{formatMoney(p.amountPaise)}</span>
                        <span className="text-[9px] text-gray-500 md:hidden">{dateStr} • {method}</span>
                      </div>
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${methodColor}`}>
                        {method}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-gray-400 hidden lg:table-cell">
                      {fullDateStr} {timeStr}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3 text-gray-500">
                        <button 
                          onClick={() => setSelectedPayment(p)}
                          className="hover:text-white transition-colors flex items-center gap-1 bg-[#1a1a1a] px-2 py-1 rounded border border-[#333] hover:border-gray-500" 
                          title="View details"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          <span className="text-[10px] font-bold uppercase hidden md:inline">View</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No payments found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0f0f11]/80 backdrop-blur-sm">
          <div className="bg-[#161616] border border-[#333] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
             <div className="flex items-center justify-between p-5 border-b border-[#333]">
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Payment Details</h3>
                <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-white transition bg-[#1a1a1a] p-1.5 rounded-full border border-[#333]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
             </div>
             <div className="p-6 space-y-4 text-sm text-gray-400">
                <div className="flex justify-between items-center border-b border-[#333]/50 pb-3">
                   <span className="font-semibold uppercase tracking-wider text-[10px]">Transaction ID</span>
                   <span className="font-mono font-bold text-white bg-[#1a1a1a] px-2 py-1 rounded border border-[#333]">{selectedPayment.utr || selectedPayment.refCode || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#333]/50 pb-3">
                   <span className="font-semibold uppercase tracking-wider text-[10px]">Amount</span>
                   <span className="font-black text-[#a5d8ce] text-xl">{formatMoney(selectedPayment.amountPaise)}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#333]/50 pb-3">
                   <span className="font-semibold uppercase tracking-wider text-[10px]">Payer</span>
                   <span className="font-bold text-white">{selectedPayment.personId?.name || selectedPayment.senderName || "Unknown"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#333]/50 pb-3">
                   <span className="font-semibold uppercase tracking-wider text-[10px]">Bill Title</span>
                   <span className="font-bold text-white">{selectedPayment.billId?.title || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#333]/50 pb-3">
                   <span className="font-semibold uppercase tracking-wider text-[10px]">Payment Method</span>
                   <span className="font-bold text-white capitalize">{selectedPayment.method}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#333]/50 pb-3">
                   <span className="font-semibold uppercase tracking-wider text-[10px]">Status</span>
                   <span className="font-bold text-white capitalize bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#333]">{selectedPayment.status}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#333]/50 pb-3">
                   <span className="font-semibold uppercase tracking-wider text-[10px]">Date & Time</span>
                   <span className="font-medium text-white">{new Date(selectedPayment.paymentTime || selectedPayment.createdAt).toLocaleString()}</span>
                </div>
                {selectedPayment.metadata?.token && (
                  <div className="flex justify-between items-center pt-1">
                     <span className="font-semibold uppercase tracking-wider text-[10px]">Secure Token</span>
                     <span className="font-mono text-[10px] text-gray-500 truncate max-w-[200px]">{selectedPayment.metadata.token}</span>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
