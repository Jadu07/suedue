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
        <div className="h-4 w-24 rounded bg-canvas-soft" />
        <div className="rounded-2xl border border-hairline bg-canvas p-4 space-y-2">
          <div className="h-6 w-40 rounded bg-canvas-soft" />
          <div className="h-3 w-64 max-w-full rounded bg-canvas-soft" />
        </div>
        <div className="rounded-2xl border border-hairline bg-canvas p-4 space-y-4">
          <div className="h-3 w-24 rounded bg-canvas-soft" />
          <div className="h-11 w-full rounded-xl bg-canvas-soft" />
          <div className="h-11 w-full rounded-xl bg-canvas-soft" />
          <div className="h-11 w-full rounded-xl bg-canvas-soft" />
        </div>
        <div className="rounded-2xl border border-hairline bg-canvas p-4 space-y-4">
          <div className="h-5 w-36 rounded bg-canvas-soft" />
          <div className="h-24 w-full rounded-xl bg-canvas-soft" />
          <div className="h-12 w-full rounded-xl bg-canvas-soft" />
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
    <div className="p-3 sm:p-md md:p-huge max-w-2xl mx-auto space-y-md pb-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-1 text-xs text-ink-mute hover:text-ink transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Bills</span>
        </Link>
      </div>

      <div className="rounded-2xl border border-hairline bg-canvas p-4 shadow-2xs">
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-ink">Create bill</h1>
          <p className="mt-1 text-xs text-ink-mute">Add an expense and split it with your people.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-lg">
        {/* Bill Info Card */}
        <div className="bg-canvas border border-hairline rounded-2xl p-3 sm:p-md md:p-xl space-y-md shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                Bill title *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinner at Socials, WiFi Bill, Groceries"
                  className="h-11 w-full bg-canvas text-ink border border-hairline rounded-xl pl-9 pr-md text-sm focus:outline-none focus:border-ink transition font-medium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  className="h-11 w-full bg-canvas text-ink border border-hairline rounded-xl pl-9 pr-md text-sm focus:outline-none focus:border-ink transition font-medium"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
              Note <span className="font-medium normal-case tracking-normal text-ink-faint">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="Add optional notes or item breakdown"
              className="h-11 w-full bg-canvas text-ink border border-hairline rounded-xl px-md text-sm focus:outline-none focus:border-ink transition font-medium"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Splits Card */}
        <div className="bg-canvas border border-hairline rounded-2xl p-3 sm:p-md md:p-xl space-y-md shadow-sm">
          <div className="flex justify-between items-center pb-xs border-b border-hairline">
            <div>
              <h3 className="font-bold text-ink text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span>Split breakdown</span>
              </h3>
              <p className="text-[11px] text-ink-mute mt-0.5">
                Add who owes what
              </p>
            </div>
            
            <button
              type="button"
              onClick={addSplit}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-canvas-soft border border-hairline hover:bg-canvas rounded-xl text-xs font-bold text-ink transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Add person</span>
            </button>
          </div>

          {/* Splits List */}
          <div className="space-y-sm">
            {splits.map((split, idx) => {
              const selectedPerson = people.find(p => p._id === split.personId);
              return (
                <div
                  key={idx}
                  className="bg-canvas-soft/60 border border-hairline rounded-xl p-3 md:p-md flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 transition hover:border-ink/20"
                >
                  {/* Person Selector with Avatar */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {selectedPerson ? (
                      <UserAvatar name={selectedPerson.name} size="sm" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg border border-hairline bg-canvas flex items-center justify-center text-ink-faint shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <select
                      required
                      className="h-11 w-full bg-canvas text-ink border border-hairline rounded-xl px-md text-sm focus:outline-none focus:border-ink transition font-medium cursor-pointer"
                      value={split.personId}
                      onChange={(e) => updateSplit(idx, "personId", e.target.value)}
                    >
                      <option value="">Select person...</option>
                      {people.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Input & Remove Button */}
                  <div className="flex items-center gap-xs sm:gap-sm flex-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleAmountSign(idx)}
                      disabled={!split.amountRupees || split.amountRupees === "-" || split.amountRupees === "+"}
                      aria-label={split.isDeduction ? "Make amount positive" : "Make amount negative"}
                      className={`h-8 w-8 shrink-0 rounded-lg border text-sm font-black transition active:scale-95 disabled:opacity-30 ${
                        split.isDeduction
                          ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {split.isDeduction ? "+" : "−"}
                    </button>
                    <div className="relative flex-1 min-w-0 sm:w-36 sm:flex-initial">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${split.isDeduction ? "text-red-600" : "text-emerald-700"}`}>
                        ₹
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        placeholder="0.00"
                        className={`h-11 w-full bg-canvas border rounded-xl pl-7 pr-md text-sm font-mono font-bold focus:outline-none transition ${
                          split.isDeduction
                            ? "border-red-200 bg-red-50/40 text-red-600 focus:border-red-500"
                            : split.amountRupees
                              ? "border-emerald-200 bg-emerald-50/40 text-emerald-700 focus:border-emerald-500"
                              : "border-hairline text-ink focus:border-ink"
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

                    {/* Remove Button (perfect height and alignment) */}
                    <button
                      type="button"
                      onClick={() => removeSplit(idx)}
                      disabled={splits.length <= 1}
                      className="h-[34px] w-[34px] shrink-0 flex items-center justify-center rounded-xl border border-hairline bg-canvas hover:bg-red-50 text-ink-faint hover:text-red-600 transition disabled:opacity-30 disabled:pointer-events-none"
                      title="Remove split"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {splits.length === 0 && (
              <div className="text-center py-md text-xs text-ink-mute bg-canvas-soft rounded-xl border border-hairline">
                No people added to this bill. Click &quot;Add Person&quot; above.
              </div>
            )}
          </div>

          {/* Live Total Calculation Banner with Deductions */}
          {negativeTotalPaise > 0 ? (
            <div className="p-md bg-canvas rounded-xl border border-hairline mt-md space-y-2 shadow-2xs">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-hairline/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-mute font-medium">Charges:</span>
                  <span className="font-bold text-ink">{formatMoney(positiveTotalPaise)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-700 font-medium">Deductions:</span>
                  <span className="font-bold text-amber-700">-{formatMoney(negativeTotalPaise)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-0.5">
                <div>
                  <span className="text-[11px] text-ink-mute uppercase tracking-wider font-bold">Net Bill Amount:</span>
                  <p className="text-xs text-ink-faint">
                    {liveTotalPaise < 0 ? "Negative bill (credits/refunds to members)" : "Total amount after deducting -ve"}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xl font-black ${liveTotalPaise < 0 ? "text-amber-600" : "text-ink"}`}>
                    {formatMoney(liveTotalPaise)}
                  </span>
                  {liveTotalPaise < 0 && (
                    <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                      Negative Bill
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-md bg-canvas rounded-xl border border-hairline flex justify-between items-center mt-md">
              <div>
                <span className="text-[11px] text-ink-mute uppercase tracking-wider font-bold">Total</span>
                <p className="text-xs text-ink-faint">From your splits</p>
              </div>
              <div className="text-right">
                <span className={`text-xl font-black ${liveTotalPaise < 0 ? "text-amber-600" : "text-ink"}`}>
                  {formatMoney(liveTotalPaise)}
                </span>
                {liveTotalPaise < 0 && (
                  <span className="block text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                    Negative Bill
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col-reverse sm:flex-row justify-end items-center gap-sm pt-xs">
          <Button 
            type="button" 
            onClick={() => router.back()} 
            className="btn-secondary-outline w-full sm:w-auto text-xs py-2.5"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || splits.length === 0 || liveTotalPaise === 0} 
            className="btn-primary-dark w-full sm:w-auto text-xs py-2.5 shadow-sm"
          >
            {loading ? "Creating…" : `Create bill · ${formatMoney(liveTotalPaise)}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
