"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toPaise, formatMoney } from "@/lib/money";
import { Trash2, Plus, ArrowLeft, Users, Calendar, FileText, LoaderCircle } from "lucide-react";
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
  const [splashDone, setSplashDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const personId = searchParams.get("personId") || "";
  const requestedReturnTo = searchParams.get("returnTo") || "";
  const returnTo = requestedReturnTo.startsWith("/dashboard") ? requestedReturnTo : "/dashboard";

  useEffect(() => {
    setPageLoading(true);
    const splashTimer = window.setTimeout(() => setSplashDone(true), 500);
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

    return () => window.clearTimeout(splashTimer);
  }, [personId]);

  const addSplit = () => {
    setSplits([...splits, { personId: "", amountRupees: "", isDeduction: false }]);
  };

  const updateSplit = (index: number, field: string, value: any) => {
    const newSplits = [...splits];
    if (field === "amountRupees") {
      // If user typed negative sign or negative number, auto-toggle deduction
      const rawStr = String(value);
      if (rawStr.startsWith("-")) {
        const cleaned = rawStr.replace(/^-/, "");
        newSplits[index] = { ...newSplits[index], amountRupees: cleaned, isDeduction: true };
      } else {
        newSplits[index] = { ...newSplits[index], [field]: value };
      }
    } else {
      newSplits[index] = { ...newSplits[index], [field]: value };
    }
    setSplits(newSplits);
  };

  const toggleDeduction = (index: number) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], isDeduction: !newSplits[index].isDeduction };
    setSplits(newSplits);
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
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

  if (!splashDone) {
    return (
      <div className="flex min-h-[70dvh] items-center justify-center bg-canvas p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-sm">
            <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-ink">Preparing your bill…</p>
          <p className="text-xs text-ink-mute">Just a moment</p>
        </div>
      </div>
    );
  }

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

                  {/* Amount Input, Deduction Toggle & Remove Button */}
                  <div className="flex items-center gap-xs sm:gap-sm flex-nowrap">
                    {/* Toggle Charge vs Deduct */}
                    <button
                      type="button"
                      onClick={() => toggleDeduction(idx)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 shrink-0 ${
                        split.isDeduction
                          ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                          : "bg-canvas text-ink border border-hairline hover:bg-canvas-soft"
                      }`}
                      title={split.isDeduction ? "Switched to Deduction (-). Click to change to Charge (+)" : "Switched to Charge (+). Click to change to Deduction (-)"}
                    >
                      <span>{split.isDeduction ? "− Deduct" : "+ Charge"}</span>
                    </button>

                    <div className="relative flex-1 min-w-0 sm:w-36 sm:flex-initial">
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold ${split.isDeduction ? "text-amber-700" : "text-ink-mute"}`}>
                        {split.isDeduction ? "−₹" : "₹"}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        className={`h-11 w-full bg-canvas text-ink border rounded-xl pl-7 pr-md text-sm font-mono font-bold focus:outline-none transition ${
                          split.isDeduction ? "border-amber-300 focus:border-amber-500 bg-amber-50/30" : "border-hairline focus:border-ink"
                        }`}
                        value={split.amountRupees}
                        onChange={(e) => updateSplit(idx, "amountRupees", e.target.value)}
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
