"use client";

import { useState } from "react";
import { formatMoney, toRupees } from "@/lib/money";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/UserAvatar";
import { MessageSquare, Check, CheckCircle2, X } from "lucide-react";
import { formatSplitTitleWithDate } from "@/lib/whatsappDate";

export default function BillSplitRow({
  split,
  person,
  totalPaidPaise,
  remainingPaise,
  includeYearInWhatsApp = false,
}: any) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [amountRupees, setAmountRupees] = useState(toRupees(remainingPaise).toString());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
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
    setWaLoading(true);
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ splitId: split._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Fallback to direct wa.me
        let cleanPhone = (person.phone || "").replace(/\D/g, "");
        if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
        const bDate = split.billId?.date ? new Date(split.billId.date) : null;
        const titleWithDate = formatSplitTitleWithDate(split.billId?.title || "Bill", bDate, Boolean(includeYearInWhatsApp));
        const msg = data?.messageText || `Hi *${person.name}*,\nPlease pay *${formatMoney(remainingPaise)}* for *${titleWithDate}*.\n\n_Powered by suedue_`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
      } else {
        alert("WhatsApp message sent successfully!");
      }
    } catch (err) {
      let cleanPhone = (person.phone || "").replace(/\D/g, "");
      if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
      const bDate = split.billId?.date ? new Date(split.billId.date) : null;
      const titleWithDate = formatSplitTitleWithDate(split.billId?.title || "Bill", bDate, Boolean(includeYearInWhatsApp));
      const msg = `Hi *${person.name}*,\nPlease pay *${formatMoney(remainingPaise)}* for *${titleWithDate}*.\n\n_Powered by suedue_`;
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    } finally {
      setWaLoading(false);
    }
  };

  const isDeduction = split.originalAmountPaise < 0;
  const isFullySettled = isDeduction || remainingPaise <= 0;

  return (
    <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#1a1a1a]/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <UserAvatar name={person.name} size="md" />
        <div className="min-w-0">
          <h4 className="font-bold text-white text-sm truncate">{person.name}</h4>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 text-xs text-gray-400">
            <span>
              Split: <strong className={isDeduction ? "text-amber-700 font-bold" : "text-white font-semibold"}>{formatMoney(split.originalAmountPaise)}</strong>
              {isDeduction && <span className="ml-1 text-[10px] font-bold text-amber-700 bg-amber-900/30 px-1.5 py-0.5 rounded-full">Deduction</span>}
            </span>
            {totalPaidPaise > 0 && (
              <span>Paid: <strong className="text-emerald-500 font-semibold">{formatMoney(totalPaidPaise)}</strong></span>
            )}
            {!isFullySettled ? (
              <span>Due: <strong className="text-white font-black">{formatMoney(remainingPaise)}</strong></span>
            ) : null}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto w-full sm:w-auto pt-2 sm:pt-0 border-t border-[#333]/40 sm:border-0 mt-1 sm:mt-0">
        {!isFullySettled ? (
          <>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={waLoading}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-2.5 py-2 sm:py-1.5 rounded-xl border border-[#333] bg-[#161616] hover:bg-[#1a1a1a] active:scale-95 text-xs font-bold text-white transition shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
              <span>{waLoading ? "Sending..." : "Remind"}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-[#a5d8ce] text-black hover:bg-[#8ec2b8] active:scale-95 text-xs font-bold transition shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Paid</span>
            </button>
          </>
        ) : (
          <span className="w-full sm:w-auto justify-center inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-2 sm:py-1 rounded-xl sm:rounded-full bg-[#1a1a1a] text-white border border-[#333]">
            <CheckCircle2 className={`w-3 h-3 ${isDeduction ? "text-amber-600" : "text-emerald-500"}`} />
            <span>{isDeduction ? "Credit / Deducted" : "Settled"}</span>
          </span>
        )}
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-[#161616] p-5 sm:p-6 rounded-2xl max-w-sm w-full shadow-xl border border-[#333] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm sm:text-base">Record Payment</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1 text-gray-500 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-3 text-xs">
              <p className="text-gray-400">Person: <strong className="text-white">{person.name}</strong></p>
              <p className="text-gray-400 mt-1">Remaining Due: <strong className="text-white font-bold">{formatMoney(remainingPaise)}</strong></p>
            </div>
            
            <form onSubmit={handleMarkPaid} className="space-y-3.5">
              <div>
                <label className="block text-gray-400 text-[11px] uppercase font-bold tracking-wider mb-1">
                  Payment amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={toRupees(remainingPaise)}
                  required
                  className="w-full bg-[#161616] text-white border border-[#333] rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-[#a5d8ce] transition"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] uppercase font-bold tracking-wider mb-1">
                  Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via cash / GPay"
                  className="w-full bg-[#161616] text-white border border-[#333] rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-[#a5d8ce] transition"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#a5d8ce] text-black hover:bg-[#8ec2b8] active:scale-95 rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {loading ? "Saving..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
