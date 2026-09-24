"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Loader2, FileText } from "lucide-react";
import { formatMoney } from "@/lib/money";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ people: any[], bills: any[] }>({ people: [], bills: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults({ people: [], bills: [] });
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/people?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  if (pathname === '/login') return null;

  return (
    <div className="relative w-full max-w-md group" ref={dropdownRef}>
      <form onSubmit={handleSearch} className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#a5d8ce] w-4 h-4 transition-colors z-10" />
        <input 
          ref={inputRef}
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search anything..." 
          className="w-full bg-[#1a1a1a] border border-[#333] rounded-xl pl-10 pr-12 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#a5d8ce] focus:ring-1 focus:ring-[#a5d8ce] focus:bg-[#222] transition-all shadow-sm relative z-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-50 group-focus-within:opacity-0 transition-opacity pointer-events-none z-10">
          <kbd className="font-sans text-[10px] font-medium px-1.5 py-0.5 bg-[#222] border border-[#444] rounded text-gray-300">⌘K</kbd>
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#161616] border border-[#333] rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[70vh]">
          {loading ? (
            <div className="p-4 flex items-center justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : results.people?.length === 0 && results.bills?.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <div className="overflow-y-auto p-2">
              {results.people?.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">People</div>
                  {results.people.map(person => (
                    <button
                      key={person.id}
                      onClick={() => {
                        router.push(`/dashboard/people/${person.id}`);
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#222] rounded-lg transition-colors text-left"
                    >
                      <img src={`https://api.dicebear.com/10.x/glyphs/svg?seed=${encodeURIComponent(person.name)}`} alt="" className="w-8 h-8 rounded-full border border-[#333] bg-[#1a1a1a]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{person.name}</div>
                        <div className="text-xs text-gray-400 truncate">{person.phone}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {results.bills?.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Bills</div>
                  {results.bills.map(bill => (
                    <button
                      key={bill.id}
                      onClick={() => {
                        router.push(`/dashboard/bills/${bill.id}`);
                        setShowDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#222] rounded-lg transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full border border-[#333] bg-[#1a1a1a] flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{bill.title}</div>
                        <div className="text-xs text-gray-400 truncate">
                          {bill.date ? new Date(bill.date).toLocaleDateString() : ""} • {bill.status === "PAID" ? "Settled" : "Pending"}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-[#a5d8ce]">
                        {formatMoney(bill.amountPaise)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
