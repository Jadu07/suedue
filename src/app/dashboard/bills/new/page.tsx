"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toPaise, formatMoney } from "@/lib/money";
import { Trash2, Plus, ArrowLeft, Users, Calendar, FileText } from "lucide-react";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";

export default function NewBillPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [people, setPeople] = useState<any[]>([]);
  
  // Splits: array of { personId, amountRupees, isDeduction }
  const [splits, setSplits] = useState<{ personId: string; amountRupees: string; isDeduction?: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const personId = searchParams.get("personId") || "";
  const requestedReturnTo = searchParams.get("returnTo") || "";
  const returnTo = requestedReturnTo.startsWith("/dashboard") ? requestedReturnTo : "/dashboard";

  useEffect(() => {
    setPageLoading(true);
    fetch("/api/people")
      .then(r => r.json())
      .then(data => {
        const pList = data.people || [];
        setPeople(pList);
        // Start with one empty split by default
        if (pList.length > 0) {
          setSplits(current => current.length === 0
            ? [{ personId, amountRupees: "", isDeduction: false }]
            : current
          );
        }
      })
      .catch(console.error)
      .finally(() => setPageLoading(false));
  }, [personId]);

  const addSplit = () => {
    setSplits([...splits, { personId: "", amountRupees: "", isDeduction: false }]);
  };

  const updateSplit = (index: number, field: string, value: any) => {
    const newSplits = [...splits];
    if (field === "amountRupees") {
      // Keep the sign while typing; stripping it on the first keypress makes
      // controlled number inputs accept only one digit on mobile Safari.
      const rawStr = String(value).trim();
      const isNegative = rawStr.startsWith("-");
      newSplits[index] = {
        ...newSplits[index],
        amountRupees: rawStr,
        isDeduction: isNegative,
      };
    } else {
      newSplits[index] = { ...newSplits[index], [field]: value };
    }
    setSplits(newSplits);
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  const toggleAmountSign = (index: number) => {
    const current = splits[index]?.amountRupees.trim() || "";
    const magnitude = current.replace(/^[+-]/, "");
    if (!magnitude) return;
    updateSplit(index, "amountRupees", current.startsWith("-") ? magnitude : `-${magnitude}`);
  };

  // Calculate live positive, negative, and net totals
  const positiveTotalPaise = splits.reduce((acc, s) => {
    if (s.isDeduction) return acc;
    const val = Math.abs(parseFloat(s.amountRupees) || 0);
    return acc + toPaise(val);
  }, 0);

  const negativeTotalPaise = splits.reduce((acc, s) => {
    if (!s.isDeduction) return acc;
    const val = Math.abs(parseFloat(s.amountRupees) || 0);
    return acc + toPaise(val);
  }, 0);

  const liveTotalPaise = positiveTotalPaise - negativeTotalPaise;

  if (pageLoading) {
    return (
      <div className="p-3 sm:p-md md:p-huge max-w-2xl mx-auto space-y-md animate-pulse">
        <div className="h-4 w-24 rounded bg-[#1a1a1a]" />
        <div className="rounded-2xl border border-[#333] bg-[#161616] p-4 space-y-2">
          <div className="h-6 w-40 rounded bg-[#1a1a1a]" />
          <div className="h-3 w-64 max-w-full rounded bg-[#1a1a1a]" />
        </div>
        <div className="rounded-2xl border border-[#333] bg-[#161616] p-4 space-y-4">
          <div className="h-3 w-24 rounded bg-[#1a1a1a]" />
          <div className="h-11 w-full rounded-xl bg-[#1a1a1a]" />
          <div className="h-11 w-full rounded-xl bg-[#1a1a1a]" />
          <div className="h-11 w-full rounded-xl bg-[#1a1a1a]" />
        </div>
        <div className="rounded-2xl border border-[#333] bg-[#161616] p-4 space-y-4">
          <div className="h-5 w-36 rounded bg-[#1a1a1a]" />
          <div className="h-24 w-full rounded-xl bg-[#1a1a1a]" />
          <div className="h-12 w-full rounded-xl bg-[#1a1a1a]" />
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (splits.length === 0) {
      alert("Please add at least one person to the bill.");
      return;
    }

    const invalidSplit = splits.some(s => !s.personId || !(Math.abs(parseFloat(s.amountRupees)) > 0));
    if (invalidSplit) {
      alert("Please select a person and enter a valid non-zero amount for all splits.");
      return;
    }

    if (liveTotalPaise === 0) {
      alert("Total bill amount cannot be zero. Adjust charges or deductions.");
      return;
    }

    setLoading(true);
    try {
      let totalAmountPaise = 0;
      const parsedSplits = splits.map(s => {
        const rawAmt = Math.abs(parseFloat(s.amountRupees) || 0);
        const signedAmt = s.isDeduction ? -rawAmt : rawAmt;
        const amtPaise = toPaise(signedAmt);
        totalAmountPaise += amtPaise;
        return {
          personId: s.personId,
          originalAmountPaise: amtPaise
        };
      });

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          date,
          category,
          totalAmountPaise,
          splits: parsedSplits
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create bill");
      }

      router.push(returnTo);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error creating bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl mx-auto pb-12">
      {/* Top Breadcrumb */}
      <div>
        <Link 
          href="/dashboard" 
          className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition py-2 touch-manipulation"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bills</span>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-white">Create bill</h1>
        <p className="mt-1 text-sm text-gray-400">Add an expense and split it.</p>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-[#0f0f11]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#1a1a1a] border-t-[#a5d8ce] rounded-full animate-spin"></div>
          <div className="text-white font-bold tracking-widest text-sm uppercase">Creating bill...</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 relative">
        {/* Bill Info Section */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">
                Bill title
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. WiFi Bill"
                  className="h-12 w-full bg-[#1a1a1a] text-white rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#a5d8ce]/50 transition font-bold border border-transparent hover:border-[#333] placeholder:text-gray-600 placeholder:font-medium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">
                Category
              </label>
              <select
                className="h-12 w-full bg-[#1a1a1a] text-white rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#a5d8ce]/50 transition font-bold border border-transparent hover:border-[#333] cursor-pointer"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Food & Dining">Food & Dining</option>
                <option value="Utilities">Utilities</option>
                <option value="Rent">Rent</option>
                <option value="Travel">Travel</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                className="h-12 w-full bg-[#1a1a1a] text-white rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#a5d8ce]/50 transition font-bold border border-transparent hover:border-[#333]"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">
              Note <span className="font-medium text-gray-600">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Add optional notes..."
              className="h-12 w-full bg-[#1a1a1a] text-white rounded-xl px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#a5d8ce]/50 transition font-medium border border-transparent hover:border-[#333] placeholder:text-gray-600"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#333] to-transparent my-6"></div>

        {/* Splits Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center ml-1">
            <div>
              <h3 className="font-bold text-white text-base">Split breakdown</h3>
            </div>
            
            <button
              type="button"
              onClick={addSplit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#333] rounded-full text-xs font-bold text-white transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-[#a5d8ce]" />
              <span>Add person</span>
            </button>
          </div>

          <div className="space-y-3">
            {splits.map((split, idx) => {
              const selectedPerson = people.find(p => p._id === split.personId);
              return (
                <div
                  key={idx}
                  className="bg-[#1a1a1a] rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 transition"
                >
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {selectedPerson ? (
                      <UserAvatar name={selectedPerson.name} size="md" />
                    ) : (
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#333] flex items-center justify-center text-gray-500 shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                    )}
                    <select
                      required
                      className="h-12 w-full bg-transparent text-white px-2 text-sm focus:outline-none transition font-bold cursor-pointer"
                      value={split.personId}
                      onChange={(e) => updateSplit(idx, "personId", e.target.value)}
                    >
                      <option value="" className="bg-[#1a1a1a]">Select person...</option>
                      {people.map(p => (
                        <option key={p._id} value={p._id} className="bg-[#1a1a1a]">{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 flex-nowrap bg-[#0f0f11] p-1.5 rounded-xl border border-[#333]">
                    <button
                      type="button"
                      onClick={() => toggleAmountSign(idx)}
                      disabled={!split.amountRupees || split.amountRupees === "-" || split.amountRupees === "+"}
                      className={`h-9 w-9 shrink-0 rounded-lg text-sm font-black transition active:scale-95 disabled:opacity-30 ${
                        split.isDeduction
                          ? "bg-red-500/20 text-red-500"
                          : "bg-emerald-500/20 text-emerald-500"
                      }`}
                    >
                      {split.isDeduction ? "+" : "−"}
                    </button>
                    <div className="relative flex-1 min-w-0 sm:w-32">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${split.isDeduction ? "text-red-500" : "text-emerald-500"}`}>
                        ₹
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        placeholder="0.00"
                        className={`h-9 w-full bg-transparent pl-7 pr-2 text-sm font-mono font-bold focus:outline-none transition ${
                          split.isDeduction ? "text-red-500" : "text-emerald-500"
                        }`}
                        value={split.amountRupees}
                        onChange={(e) => updateSplit(idx, "amountRupees", e.target.value)}
                        onBlur={() => {
                          if (split.amountRupees.startsWith("+")) {
                            updateSplit(idx, "amountRupees", split.amountRupees.slice(1));
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSplit(idx)}
                      disabled={splits.length <= 1}
                      className="h-9 w-9 shrink-0 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Total Banner */}
          <div className="mt-6 flex justify-between items-center px-4 py-4 bg-[#1a1a1a] rounded-2xl border border-[#333]">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
              {negativeTotalPaise > 0 && (
                <p className="text-[10px] text-gray-500 mt-0.5">Includes {formatMoney(negativeTotalPaise)} in deductions</p>
              )}
            </div>
            <div className="text-right">
              <span className={`text-2xl font-black ${liveTotalPaise < 0 ? "text-red-500" : "text-white"}`}>
                {formatMoney(liveTotalPaise)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-1/3 py-3.5 rounded-2xl text-sm font-bold text-gray-400 bg-[#1a1a1a] hover:bg-[#333] hover:text-white transition active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || splits.length === 0 || liveTotalPaise === 0}
            className="w-full sm:w-2/3 py-3.5 rounded-2xl text-sm font-black text-black bg-[#a5d8ce] hover:bg-[#8ec2b8] transition shadow-lg active:scale-95 disabled:opacity-30"
          >
            {loading ? "Creating…" : `Create Bill`}
          </button>
        </div>
      </form>
    </div>
  );
}
