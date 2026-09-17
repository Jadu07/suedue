"use client";

import { useState, useMemo } from "react";
import { formatMoney } from "@/lib/money";
import { Search, Copy, Check, Info, RefreshCw, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PaymentsClient({ initialPayments }: { initialPayments: any[] }) {
  const [search, setSearch] = useState("");
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
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
    if (!q) return initialPayments;
    return initialPayments.filter((p) => {
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
  }, [initialPayments, search]);

  const totalAmountVerified = useMemo(() => {
    return initialPayments
      .filter((p) => p.status === "VERIFIED")
      .reduce((acc, p) => acc + (p.amountPaise || 0), 0);
  }, [initialPayments]);

  const verifiedCount = useMemo(() => {
    return initialPayments.filter((p) => p.status === "VERIFIED").length;
  }, [initialPayments]);

  return (
    <div className="space-y-md">
      {/* Header & Sync Bar */}
      <div className="hidden md:flex md:items-center justify-between gap-md">
        <div>
          <h1 className="display-lg text-ink font-black tracking-tight">Payments</h1>
          <p className="text-xs text-ink-mute mt-0.5">
            Real-time ledger of verified UPI transactions and payment requests.
          </p>
        </div>

        {/* Sync Button with Explanation */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="inline-flex items-center justify-center gap-2 px-md py-2 bg-ink text-canvas hover:bg-ink/90 active:scale-[0.98] rounded-xl text-xs font-bold transition shadow-sm"
            title="Fetches new FamPay receipts from Gmail and checks all pending bills right now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span>{syncing ? "Checking Gmail..." : "Sync FamPay Now"}</span>
          </button>
          <span className="text-[11px] text-ink-faint flex items-center gap-1">
            <Info className="w-3 h-3 inline" />
            <span>Checks Gmail for new FamPay credit receipts</span>
          </span>
        </div>
      </div>

      {/* Mobile Actions: Clean full-width sync button */}
      <div className="md:hidden">
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="w-full inline-flex items-center justify-center gap-2 px-md py-2.5 bg-ink text-canvas hover:bg-ink/90 active:scale-[0.98] rounded-xl text-xs font-bold transition shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Checking Gmail..." : "Sync FamPay Now"}</span>
        </button>
      </div>

      {/* Sync Notification Banner */}
      {syncMessage && (
        <div className="p-sm bg-canvas-soft border border-hairline rounded-xl text-xs font-medium text-ink animate-in fade-in duration-200">
          {syncMessage}
        </div>
      )}

      {/* Minimal Stat Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
        <div className="bg-canvas border border-hairline p-md rounded-xl">
          <span className="text-[11px] text-ink-mute uppercase tracking-wider font-semibold">Total Verified</span>
          <p className="text-xl font-black text-ink mt-0.5">{formatMoney(totalAmountVerified)}</p>
        </div>
        <div className="bg-canvas border border-hairline p-md rounded-xl">
          <span className="text-[11px] text-ink-mute uppercase tracking-wider font-semibold">Payments</span>
          <p className="text-xl font-black text-ink mt-0.5">{verifiedCount}</p>
        </div>
        <div className="bg-canvas border border-hairline p-md rounded-xl col-span-2 sm:col-span-1">
          <span className="text-[11px] text-ink-mute uppercase tracking-wider font-semibold">Verification Engine</span>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-bold text-ink">IMAP IDLE Active</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-ink-mute absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by person, bill, UTR, or token (e.g. SD4687)..."
          className="w-full bg-canvas text-ink border border-hairline rounded-xl pl-10 pr-md py-2 text-xs focus:outline-none focus:border-ink transition placeholder:text-ink-faint"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-mute hover:text-ink"
          >
            Clear
          </button>
        )}
      </div>

      {/* Mobile Card View (md:hidden) */}
      <div className="md:hidden space-y-sm">
        {filteredPayments.map((p) => {
          const dt = new Date(p.paymentTime || p.createdAt);
          const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

          return (
            <div key={p._id.toString()} className="bg-canvas border border-hairline rounded-xl p-md space-y-sm shadow-sm">
              {/* Header: Person + Amount */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-ink text-sm">{p.personId?.name || "Unknown Person"}</h3>
                  <p className="text-xs text-ink-mute mt-0.5">{p.billId?.title || "Consolidated Dues"}</p>
                </div>
                <span className="text-base font-black text-ink">
                  {formatMoney(p.amountPaise)}
                </span>
              </div>

              {/* Middle: UTR + Token */}
              <div className="bg-canvas-soft border border-hairline rounded-lg p-sm space-y-1 text-xs">
                {p.utr && (
                  <div className="flex justify-between items-center font-mono">
                    <span className="text-ink-mute text-[11px]">UTR:</span>
                    <button
                      onClick={() => handleCopyUtr(p.utr)}
                      className="inline-flex items-center gap-1 font-bold text-ink hover:text-primary transition"
                      title="Copy UTR"
                    >
                      <span>{p.utr}</span>
                      {copiedUtr === p.utr ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-ink-faint" />}
                    </button>
                  </div>
                )}

                {p.refCode && (
                  <div className="flex justify-between items-center">
                    <span className="text-ink-mute text-[11px]">Token:</span>
                    <span className="font-mono font-bold text-[11px] bg-canvas border border-hairline px-1.5 py-0.5 rounded text-ink">
                      {p.refCode}
                    </span>
                  </div>
                )}

                {p.senderName && (
                  <div className="flex justify-between items-center text-[11px] text-ink-mute">
                    <span>Sender:</span>
                    <span className="font-medium text-ink">{p.senderName}</span>
                  </div>
                )}
              </div>

              {/* Footer: Date & Time + Status */}
              <div className="flex justify-between items-center pt-xs border-t border-hairline text-[11px]">
                <span className="text-ink-mute">
                  {dateStr} · {timeStr}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-green-800 bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          );
        })}

        {filteredPayments.length === 0 && (
          <div className="bg-canvas border border-hairline rounded-xl p-xl text-center text-xs text-ink-mute">
            {search ? "No payments match your search." : "No payments recorded yet."}
          </div>
        )}
      </div>

      {/* Desktop Table View (hidden on mobile, visible md and up) */}
      <div className="hidden md:block bg-canvas border border-hairline rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-canvas-soft border-b border-hairline">
            <tr>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider">Date & Time</th>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider">Person & Bill</th>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider">Amount</th>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider">UTR & Token</th>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider">Sender</th>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-xs">
            {filteredPayments.map((p) => {
              const dt = new Date(p.paymentTime || p.createdAt);
              const dateStr = dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
              const timeStr = dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

              return (
                <tr key={p._id.toString()} className="hover:bg-canvas-soft/60 transition-colors">
                  {/* Date & Time */}
                  <td className="px-md py-sm whitespace-nowrap">
                    <p className="font-bold text-ink">{dateStr}</p>
                    <p className="text-[11px] text-ink-mute">{timeStr}</p>
                  </td>

                  {/* Person & Bill */}
                  <td className="px-md py-sm">
                    <p className="font-bold text-ink">{p.personId?.name || "Unknown"}</p>
                    <p className="text-[11px] text-ink-mute truncate max-w-[160px]">
                      {p.billId?.title || "Consolidated Dues"}
                    </p>
                  </td>

                  {/* Amount */}
                  <td className="px-md py-sm font-black text-ink text-sm whitespace-nowrap">
                    {formatMoney(p.amountPaise)}
                  </td>

                  {/* UTR & Token */}
                  <td className="px-md py-sm font-mono space-y-0.5">
                    {p.utr ? (
                      <button
                        onClick={() => handleCopyUtr(p.utr)}
                        className="flex items-center gap-1 font-bold text-ink hover:text-primary transition group"
                        title="Click to copy UTR"
                      >
                        <span>{p.utr}</span>
                        {copiedUtr === p.utr ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-ink-faint opacity-0 group-hover:opacity-100 transition" />
                        )}
                      </button>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                    {p.refCode && (
                      <span className="inline-block text-[10px] bg-canvas-soft border border-hairline px-1.5 py-0.5 rounded text-ink font-semibold">
                        {p.refCode}
                      </span>
                    )}
                  </td>

                  {/* Sender */}
                  <td className="px-md py-sm text-ink-mute">
                    <p className="font-medium text-ink">{p.senderName || "—"}</p>
                    <span className="text-[10px] uppercase text-ink-faint">{p.method}</span>
                  </td>

                  {/* Status */}
                  <td className="px-md py-sm text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-bold text-[11px] text-green-800 bg-green-50 border border-green-200/60 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  </td>
                </tr>
              );
            })}

            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-lg py-xl text-center text-ink-mute">
                  {search ? "No payments match your search." : "No payments recorded yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
