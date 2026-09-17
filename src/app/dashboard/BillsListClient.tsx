"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { Search, Plus, ChevronRight, FileText, CheckCircle2, Clock, X } from "lucide-react";

export default function BillsListClient({ initialBills }: { initialBills: any[] }) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "settled">("all");

  const totalBilled = useMemo(() => {
    return initialBills.reduce((acc, b) => acc + (b.totalAmountPaise || 0), 0);
  }, [initialBills]);

  const settledCount = useMemo(() => {
    return initialBills.filter((b) => b.status === "PAID").length;
  }, [initialBills]);

  const pendingCount = useMemo(() => {
    return initialBills.filter((b) => b.status !== "PAID").length;
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

  return (
    <div className="space-y-md">
      {/* Desktop Header (hidden on mobile) */}
      <div className="hidden md:flex md:items-center justify-between gap-md">
        <div>
          <h1 className="display-lg text-ink font-black tracking-tight">Bills</h1>
          <p className="text-xs text-ink-mute mt-0.5">
            Overview of shared expenses, split balances, and settlements.
          </p>
        </div>

        <Link href="/dashboard/bills/new">
          <button className="inline-flex items-center justify-center gap-1.5 px-md py-2.5 bg-ink text-canvas hover:bg-ink/90 active:scale-95 rounded-xl text-xs font-bold transition shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Bill</span>
          </button>
        </Link>
      </div>

      {/* Mobile Top Action (clean minimal button, no repetitive header) */}
      <div className="md:hidden">
        <Link href="/dashboard/bills/new" className="block">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 px-md bg-ink text-canvas active:scale-[0.98] rounded-xl text-xs font-bold transition shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            <span>Create Bill</span>
          </button>
        </Link>
      </div>

      {/* Clean 3-Metric Overview */}
      <div className="grid grid-cols-3 gap-2 sm:gap-sm">
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] text-ink-mute uppercase tracking-wider font-semibold block truncate">
            Total Shared
          </span>
          <p className="text-base sm:text-2xl font-black text-ink mt-1 truncate">
            {formatMoney(totalBilled)}
          </p>
        </div>
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] text-ink-mute uppercase tracking-wider font-semibold block truncate">
            Bills
          </span>
          <p className="text-base sm:text-2xl font-black text-ink mt-1">
            {initialBills.length}
          </p>
        </div>
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] text-ink-mute uppercase tracking-wider font-semibold block truncate">
            Settled
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-base sm:text-2xl font-black text-ink">
              {settledCount}
            </p>
            <span className="text-[10px] sm:text-xs text-ink-faint truncate">
              / {pendingCount} due
            </span>
          </div>
        </div>
      </div>

      {/* Controls: Search & Filter Tabs */}
      <div className="space-y-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search bills by title or amount..."
              className="w-full bg-canvas text-ink border border-hairline rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-ink transition placeholder:text-ink-faint font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-mute hover:text-ink"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-canvas-soft p-1 border border-hairline rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFilterTab("all")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === "all"
                  ? "bg-canvas text-ink shadow-sm border border-hairline"
                  : "text-ink-mute hover:text-ink"
              }`}
            >
              All ({initialBills.length})
            </button>
            <button
              onClick={() => setFilterTab("pending")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === "pending"
                  ? "bg-canvas text-ink shadow-sm border border-hairline"
                  : "text-ink-mute hover:text-ink"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab("settled")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterTab === "settled"
                  ? "bg-canvas text-ink shadow-sm border border-hairline"
                  : "text-ink-mute hover:text-ink"
              }`}
            >
              Settled ({settledCount})
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Cards (md:hidden) */}
      <div className="md:hidden space-y-sm">
        {filteredBills.map((bill) => {
          const dateObj = bill.date ? new Date(bill.date) : null;
          const dateStr = dateObj && !isNaN(dateObj.getTime())
            ? dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
            : bill.date ? bill.date.split("T")[0] : "—";
          const isPaid = bill.status === "PAID";
          const isPartial = bill.status === "PARTIALLY_PAID";

          return (
            <Link
              key={bill._id}
              href={`/dashboard/bills/${bill._id}`}
              className="block bg-canvas border border-hairline rounded-xl p-3.5 shadow-sm active:bg-canvas-soft hover:border-ink/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-canvas-soft border border-hairline flex items-center justify-center text-ink shrink-0">
                    <FileText className="w-4 h-4 text-ink-mute" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink text-sm leading-snug truncate">{bill.title}</h3>
                    <p className="text-[11px] text-ink-mute mt-0.5">{dateStr}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-black text-ink text-sm tracking-tight">{formatMoney(bill.totalAmountPaise)}</p>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                      isPaid
                        ? "bg-canvas-soft text-ink border border-hairline"
                        : isPartial
                        ? "bg-canvas-soft text-ink-mute border border-hairline"
                        : "bg-canvas text-ink-mute border border-hairline"
                    }`}
                  >
                    {isPaid ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> : <Clock className="w-2.5 h-2.5" />}
                    <span>{isPaid ? "Settled" : isPartial ? "Partial" : "Pending"}</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {filteredBills.length === 0 && (
          <div className="bg-canvas border border-hairline rounded-xl p-xl text-center text-xs text-ink-mute">
            {search ? "No bills match your search." : "No bills recorded yet."}
          </div>
        )}
      </div>

      {/* Desktop Table View (hidden on mobile, visible md and up) */}
      <div className="hidden md:block bg-canvas border border-hairline rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-canvas-soft border-b border-hairline">
            <tr>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider">Title</th>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider">Date</th>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider">Amount</th>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider">Status</th>
              <th className="px-md py-sm text-ink-mute font-bold text-[11px] uppercase tracking-wider text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline text-xs">
            {filteredBills.map((bill) => {
              const dateStr = bill.date ? bill.date.split("T")[0] : "—";
              const isPaid = bill.status === "PAID";
              const isPartial = bill.status === "PARTIALLY_PAID";

              return (
                <tr
                  key={bill._id}
                  className="hover:bg-canvas-soft/60 transition-colors cursor-pointer group"
                >
                  <td className="px-md py-sm font-bold text-ink">
                    <Link href={`/dashboard/bills/${bill._id}`} className="block group-hover:text-primary transition-colors">
                      {bill.title}
                    </Link>
                  </td>
                  <td className="px-md py-sm text-ink-mute">
                    <Link href={`/dashboard/bills/${bill._id}`} className="block">
                      {dateStr}
                    </Link>
                  </td>
                  <td className="px-md py-sm font-black text-ink text-sm">
                    <Link href={`/dashboard/bills/${bill._id}`} className="block">
                      {formatMoney(bill.totalAmountPaise)}
                    </Link>
                  </td>
                  <td className="px-md py-sm">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isPaid
                          ? "bg-canvas-soft text-ink border border-hairline"
                          : isPartial
                          ? "bg-canvas-soft text-ink-mute border border-hairline"
                          : "bg-canvas text-ink-mute border border-hairline"
                      }`}
                    >
                      {isPaid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                      <span>{isPaid ? "Settled" : isPartial ? "Partial" : "Pending"}</span>
                    </span>
                  </td>
                  <td className="px-md py-sm text-right">
                    <Link
                      href={`/dashboard/bills/${bill._id}`}
                      className="inline-flex items-center gap-1 text-ink-mute hover:text-ink font-bold text-xs group-hover:translate-x-0.5 transition"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}

            {filteredBills.length === 0 && (
              <tr>
                <td colSpan={5} className="px-lg py-xl text-center text-ink-mute">
                  {search ? "No bills match your search." : "No bills recorded yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
