"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatMoney, toRupees } from "@/lib/money";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";

export default function BillSplitRow({ split, person, totalPaidPaise, remainingPaise }: any) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountRupees, setAmountRupees] = useState(toRupees(remainingPaise).toString());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/payments/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          splitId: split._id,
          billId: split.billId,
          personId: person._id,
          amountRupees: parseFloat(amountRupees),
          note
        }),
      });

      if (!res.ok) throw new Error("Failed to record payment");
      
      setShowPaymentModal(false);
      router.refresh();
    } catch (err) {
      alert("Error saving payment");
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ splitId: split._id }),
      });
      if (!res.ok) throw new Error("Failed to send WhatsApp message");
      alert("WhatsApp message sent successfully!");
    } catch (err) {
      alert("Error sending WhatsApp message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-lg flex flex-col md:flex-row md:items-center justify-between gap-md hover:bg-canvas-soft transition-colors border-b border-hairline/60 last:border-b-0">
      <div className="flex items-center gap-3">
        <UserAvatar name={person.name} size="md" />
        <div>
          <h4 className="font-bold text-ink text-sm sm:text-base">{person.name}</h4>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-xs text-ink-mute">
            <span>Split: {formatMoney(split.originalAmountPaise)}</span>
            {totalPaidPaise > 0 && (
              <span className="text-ink">Paid: {formatMoney(totalPaidPaise)}</span>
            )}
            <span className="font-black text-ink">Remaining: {formatMoney(remainingPaise)}</span>
          </div>
        </div>
      </div>
      
      <div className="flex gap-md">
        {remainingPaise > 0 && (
          <>
            <Button onClick={handleSendWhatsApp} className="btn-secondary-outline text-sm py-xs px-md h-auto">
              Send WhatsApp
            </Button>
            <Button onClick={() => setShowPaymentModal(true)} className="btn-primary-dark text-sm py-xs px-md h-auto">
              Mark Paid
            </Button>
          </>
        )}
        {remainingPaise <= 0 && (
          <span className="inline-flex items-center px-sm py-xs rounded-full micro bg-green-100 text-green-800">
            Fully Paid
          </span>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-canvas p-xl rounded-xl max-w-[448px] w-full shadow-lg border border-hairline">
            <h3 className="heading-lg text-ink mb-md">Mark Payment for {person.name}</h3>
            <p className="body-md text-ink-mute mb-lg">Remaining: {formatMoney(remainingPaise)}</p>
            
            <form onSubmit={handleMarkPaid} className="space-y-md">
              <div>
                <label className="block text-ink-mute micro mb-xs">Payment amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  max={toRupees(remainingPaise)}
                  required
                  className="w-full bg-canvas text-ink border border-hairline rounded-md px-md py-sm"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-ink-mute micro mb-xs">Method</label>
                <input type="text" disabled value="Manual" className="w-full bg-canvas-soft text-ink-mute border border-hairline rounded-md px-md py-sm" />
              </div>

              <div>
                <label className="block text-ink-mute micro mb-xs">Note</label>
                <input
                  type="text"
                  placeholder="e.g. Paid in cash"
                  className="w-full bg-canvas text-ink border border-hairline rounded-md px-md py-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="pt-md flex justify-end gap-md">
                <Button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary-outline">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="btn-primary-dark">
                  {loading ? "Saving..." : "Confirm Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
