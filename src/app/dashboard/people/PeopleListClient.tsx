"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "settled">("all");
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

  // Aggregate metrics
  const totalPeopleCount = initialPeople.length;
  const pendingPeopleCount = initialPeople.filter((p) => p.pendingPaise > 0).length;
  const settledPeopleCount = initialPeople.filter((p) => p.pendingPaise === 0).length;
  const totalOutstandingPaise = initialPeople.reduce((acc, p) => acc + (p.pendingPaise || 0), 0);

  return (
    <div className="p-md md:p-huge max-w-5xl mx-auto space-y-md md:space-y-lg">
      {/* Desktop Header (hidden on mobile) */}
      <div className="hidden md:flex md:items-center justify-between gap-md">
        <div>
          <h1 className="display-lg text-ink font-black tracking-tight">People</h1>
          <p className="text-xs text-ink-mute mt-0.5">
            Directory of split members, balances, and payment links.
          </p>
        </div>
        <Link href="/dashboard/people/new">
          <button className="btn-primary-dark shadow-sm flex items-center justify-center gap-2 py-2.5 px-xl text-xs">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Person</span>
          </button>
        </Link>
      </div>

      {/* Mobile Action Bar (clean minimal button, no repetitive header) */}
      <div className="md:hidden">
        <Link href="/dashboard/people/new" className="block">
          <button className="w-full flex items-center justify-center gap-2 py-2.5 px-md bg-ink text-canvas active:scale-[0.98] rounded-xl text-xs font-bold transition shadow-sm">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Person</span>
          </button>
        </Link>
      </div>

      {/* Clean 3-Metric Overview */}
      <div className="grid grid-cols-3 gap-2 sm:gap-sm">
        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] text-ink-mute uppercase tracking-wider font-semibold block truncate">
            Members
          </span>
          <p className="text-lg sm:text-2xl font-black text-ink mt-1">
            {totalPeopleCount}
          </p>
        </div>

        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] text-ink-mute uppercase tracking-wider font-semibold block truncate">
            Outstanding
          </span>
          <p className="text-lg sm:text-2xl font-black text-ink mt-1 truncate">
            {formatMoney(totalOutstandingPaise)}
          </p>
        </div>

        <div className="bg-canvas border border-hairline p-3 sm:p-md rounded-xl flex flex-col justify-between">
          <span className="text-[10px] sm:text-[11px] text-ink-mute uppercase tracking-wider font-semibold block truncate">
            With Dues
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <p className="text-lg sm:text-2xl font-black text-ink">
              {pendingPeopleCount}
            </p>
            <span className="text-[10px] sm:text-xs text-ink-faint">
              / {settledPeopleCount} ok
            </span>
          </div>
        </div>
      </div>

      {/* Controls: Search & Tabs */}
      <div className="space-y-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-sm">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ink-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-canvas text-ink border border-hairline rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-ink transition placeholder:text-ink-faint font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink p-0.5 rounded-full"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 bg-canvas-soft border border-hairline p-1 rounded-xl self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setFilterTab("all")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition text-center whitespace-nowrap ${
                filterTab === "all"
                  ? "bg-canvas text-ink shadow-2xs border border-hairline/80"
                  : "text-ink-mute hover:text-ink"
              }`}
            >
              All ({totalPeopleCount})
            </button>
            <button
              onClick={() => setFilterTab("pending")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition text-center whitespace-nowrap ${
                filterTab === "pending"
                  ? "bg-canvas text-ink shadow-2xs border border-hairline/80"
                  : "text-ink-mute hover:text-ink"
              }`}
            >
              Pending ({pendingPeopleCount})
            </button>
            <button
              onClick={() => setFilterTab("settled")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition text-center whitespace-nowrap ${
                filterTab === "settled"
                  ? "bg-canvas text-ink shadow-2xs border border-hairline/80"
                  : "text-ink-mute hover:text-ink"
              }`}
            >
              Settled ({settledPeopleCount})
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Card List (md:hidden) */}
      <div className="md:hidden space-y-2.5">
        {filteredPeople.map((person) => {
          const hasDues = person.pendingPaise > 0;
          const activeReq = person.activeRequest;

          return (
            <div
              key={person.id}
              onClick={() => router.push(`/dashboard/people/${person.id}`)}
              className="block bg-canvas border border-hairline rounded-xl p-3.5 shadow-2xs active:bg-canvas-soft/80 hover:border-ink/30 transition-all cursor-pointer select-none space-y-2.5"
            >
              {/* Top Row: Circular Avatar, Name, Phone & 3-Dot Menu */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={person.name} size="md" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink text-sm truncate">
                      {person.name}
                    </h3>
                    <p className="text-xs text-ink-mute flex items-center gap-1 font-mono mt-0.5">
                      <Phone className="w-3 h-3 text-ink-faint shrink-0" />
                      <span className="truncate">{person.phone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <PersonActions 
                    personId={person.id} 
                    personName={person.name} 
                    personPhone={person.phone}
                    activeLinkUrl={activeReq?.link}
                    activeRefCode={activeReq?.refCode}
                  />
                  <ChevronRight className="w-4 h-4 text-ink-faint" />
                </div>
              </div>

              {/* Middle Row: Outstanding Balance */}
              <div className="flex items-center justify-between pt-2 border-t border-hairline">
                <span className="text-[11px] text-ink-mute uppercase tracking-wider font-semibold">Balance:</span>
                {hasDues ? (
                  <span className="text-sm font-black text-ink">
                    {formatMoney(person.pendingPaise)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-mute">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Settled
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredPeople.length === 0 && (
          <div className="bg-canvas border border-hairline rounded-xl p-xl text-center space-y-sm">
            <Users className="w-8 h-8 mx-auto text-ink-faint" />
            <p className="text-sm font-medium text-ink">
              {search ? `No people found matching "${search}"` : "No people in this list"}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-primary font-bold hover:underline"
              >
                Clear search query
              </button>
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View (hidden on mobile, visible md and up - No overflow-hidden so dropdowns are not clipped) */}
      <div className="hidden md:block bg-canvas border border-hairline rounded-xl shadow-2xs">
        <table className="w-full text-left">
          <thead className="bg-canvas-soft border-b border-hairline rounded-t-xl">
            <tr>
              <th className="px-lg py-md text-ink-mute font-semibold text-[11px] uppercase tracking-wider rounded-tl-xl">Member</th>
              <th className="px-lg py-md text-ink-mute font-semibold text-[11px] uppercase tracking-wider">Phone</th>
              <th className="px-lg py-md text-ink-mute font-semibold text-[11px] uppercase tracking-wider">Outstanding Dues</th>
              <th className="px-lg py-md text-ink-mute font-semibold text-[11px] uppercase tracking-wider text-right rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filteredPeople.map((person) => {
              const hasDues = person.pendingPaise > 0;
              const activeReq = person.activeRequest;

              return (
                <tr
                  key={person.id}
                  onClick={() => router.push(`/dashboard/people/${person.id}`)}
                  className="hover:bg-canvas-soft/60 transition-colors cursor-pointer group relative"
                >
                  {/* Member Name + Proper Circular Avatar */}
                  <td className="px-lg py-md">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={person.name} size="md" />
                      <div className="min-w-0">
                        <div className="font-bold text-ink text-sm group-hover:text-primary transition-colors">
                          {person.name}
                        </div>
                        {person.email && (
                          <div className="text-xs text-ink-mute truncate">
                            {person.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-lg py-md">
                    <span className="font-mono text-xs text-ink">
                      {person.phone}
                    </span>
                  </td>

                  {/* Outstanding Balance */}
                  <td className="px-lg py-md">
                    {hasDues ? (
                      <span className="font-black text-ink text-sm">
                        {formatMoney(person.pendingPaise)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-mute">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Settled
                      </span>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-lg py-md text-right" onClick={(e) => e.stopPropagation()}>
                    <PersonActions 
                      personId={person.id} 
                      personName={person.name} 
                      personPhone={person.phone}
                      activeLinkUrl={activeReq?.link}
                      activeRefCode={activeReq?.refCode}
                    />
                  </td>
                </tr>
              );
            })}

            {filteredPeople.length === 0 && (
              <tr>
                <td colSpan={4} className="px-lg py-xxl text-center text-ink-mute space-y-sm">
                  <p className="text-sm font-medium text-ink">
                    {search ? `No people found matching "${search}"` : "No people in this list"}
                  </p>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="text-xs text-primary font-bold hover:underline"
                    >
                      Clear search query
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
