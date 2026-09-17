"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  
  // Splits: array of { personId, amountRupees }
  const [splits, setSplits] = useState<{ personId: string; amountRupees: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/people")
      .then(r => r.json())
      .then(data => {
        const pList = data.people || [];
        setPeople(pList);
        // Start with one empty split by default
        if (splits.length === 0 && pList.length > 0) {
          setSplits([{ personId: "", amountRupees: "" }]);
        }
      })
      .catch(console.error);
  }, []);

  const addSplit = () => {
    setSplits([...splits, { personId: "", amountRupees: "" }]);
  };

  const updateSplit = (index: number, field: string, value: string) => {
    const newSplits = [...splits];
    newSplits[index] = { ...newSplits[index], [field]: value };
    setSplits(newSplits);
  };

  const removeSplit = (index: number) => {
    setSplits(splits.filter((_, i) => i !== index));
  };

  // Calculate live total
  const liveTotalPaise = splits.reduce((acc, s) => {
    const val = parseFloat(s.amountRupees) || 0;
    return acc + toPaise(val);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (splits.length === 0) {
      alert("Please add at least one person to the bill.");
      return;
    }

    const invalidSplit = splits.some(s => !s.personId || !(parseFloat(s.amountRupees) > 0));
    if (invalidSplit) {
      alert("Please select a person and enter a valid amount for all splits.");
      return;
    }

    setLoading(true);
    try {
      let totalAmountPaise = 0;
      const parsedSplits = splits.map(s => {
        const amtPaise = toPaise(parseFloat(s.amountRupees) || 0);
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

      if (!res.ok) throw new Error("Failed to create bill");

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error creating bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-md md:p-huge max-w-2xl mx-auto space-y-lg">
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

      <div>
        <h1 className="display-lg text-ink font-black tracking-tight">Create Bill</h1>
        <p className="text-xs text-ink-mute mt-0.5">
          Record a shared expense and assign split amounts to group members.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-lg">
        {/* Bill Info Card */}
        <div className="bg-canvas border border-hairline rounded-2xl p-md md:p-xl space-y-md shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Bill Title *
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinner at Socials, WiFi Bill, Groceries"
                  className="w-full bg-canvas text-ink border border-hairline rounded-xl pl-9 pr-md py-2.5 text-xs focus:outline-none focus:border-ink transition font-medium"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
                Date *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  className="w-full bg-canvas text-ink border border-hairline rounded-xl pl-9 pr-md py-2.5 text-xs focus:outline-none focus:border-ink transition font-medium"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              placeholder="Add optional notes or item breakdown"
              className="w-full bg-canvas text-ink border border-hairline rounded-xl px-md py-2 text-xs focus:outline-none focus:border-ink transition font-medium"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Splits Card */}
        <div className="bg-canvas border border-hairline rounded-2xl p-md md:p-xl space-y-md shadow-sm">
          <div className="flex justify-between items-center pb-xs border-b border-hairline">
            <div>
              <h3 className="font-bold text-ink text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <span>Split Breakdown</span>
              </h3>
              <p className="text-[11px] text-ink-mute mt-0.5">
                Assign how much each person owes for this bill
              </p>
            </div>
            
            <button
              type="button"
              onClick={addSplit}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-canvas-soft border border-hairline hover:bg-canvas rounded-xl text-xs font-bold text-ink transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Add Person</span>
            </button>
          </div>

          {/* Splits List */}
          <div className="space-y-sm">
            {splits.map((split, idx) => {
              const selectedPerson = people.find(p => p._id === split.personId);
              return (
                <div
                  key={idx}
                  className="bg-canvas-soft/60 border border-hairline rounded-xl p-sm md:p-md flex flex-col sm:flex-row items-stretch sm:items-center gap-sm transition hover:border-ink/20"
                >
                  {/* Person Selector with Avatar */}
                  <div className="flex-1 flex items-center gap-2">
                    {selectedPerson ? (
                      <UserAvatar name={selectedPerson.name} size="sm" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg border border-hairline bg-canvas flex items-center justify-center text-ink-faint shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <select
                      required
                      className="w-full bg-canvas text-ink border border-hairline rounded-xl px-md py-2 text-xs focus:outline-none focus:border-ink transition font-medium cursor-pointer"
                      value={split.personId}
                      onChange={(e) => updateSplit(idx, "personId", e.target.value)}
                    >
                      <option value="">Select person...</option>
                      {people.map(p => (
                        <option key={p._id} value={p._id}>{p.name} ({p.phone})</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount Input & Perfectly Aligned Remove Button */}
                  <div className="flex items-center gap-sm">
                    <div className="relative w-full sm:w-36">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-mute">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        placeholder="0.00"
                        className="w-full bg-canvas text-ink border border-hairline rounded-xl pl-7 pr-md py-2 text-xs font-mono font-bold focus:outline-none focus:border-ink transition"
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

          {/* Live Total Calculation Banner */}
          <div className="p-md bg-canvas rounded-xl border border-hairline flex justify-between items-center mt-md">
            <div>
              <span className="text-[11px] text-ink-mute uppercase tracking-wider font-bold">Total Bill Amount:</span>
              <p className="text-xs text-ink-faint">Sum of all individual splits</p>
            </div>
            <span className="text-xl font-black text-ink">
              {formatMoney(liveTotalPaise)}
            </span>
          </div>
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
            {loading ? "Creating Bill..." : `Create Bill (${formatMoney(liveTotalPaise)})`}
          </Button>
        </div>
      </form>
    </div>
  );
}
