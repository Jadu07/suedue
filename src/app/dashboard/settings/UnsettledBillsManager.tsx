"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Receipt, 
  Users, 
  CreditCard 
} from "lucide-react";

export interface UnsettledBillItem {
  _id: string;
  title: string;
  description: string;
  date: string;
  totalAmountPaise: number;
  status: string;
  splitsCount: number;
  transactionsCount: number;
  transactionsAmountPaise: number;
  requestsCount: number;
}

export default function UnsettledBillsManager({ 
  initialBills 
}: { 
  initialBills: UnsettledBillItem[] 
}) {
  const [bills, setBills] = useState<UnsettledBillItem[]>(initialBills);
  const [selectedBill, setSelectedBill] = useState<UnsettledBillItem | null>(null);
  const [confirmCheck, setConfirmCheck] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const router = useRouter();

  const openDeleteModal = (bill: UnsettledBillItem) => {
    setSelectedBill(bill);
    setConfirmCheck(false);
    setConfirmText("");
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setSelectedBill(null);
    setConfirmCheck(false);
    setConfirmText("");
  };

  const handleDelete = async () => {
    if (!selectedBill) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/bills/${selectedBill._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete bill");
      }

      setBills(prev => prev.filter(b => b._id !== selectedBill._id));
      setToastMessage({
        text: data.message || `Bill "${selectedBill.title}" and linked transactions deleted.`,
        type: "success"
      });
      setTimeout(() => setToastMessage(null), 4000);
      closeDeleteModal();
      router.refresh();
    } catch (err: any) {
      setToastMessage({
        text: err.message || "Error deleting bill",
        type: "error"
      });
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsDeleting(false);
    }
  };

  const requiresTyping = selectedBill ? selectedBill.transactionsCount > 0 : false;
  const isConfirmValid = confirmCheck && (!requiresTyping || confirmText.trim().toUpperCase() === "DELETE");

  return (
    <div className="bg-canvas border border-red-200/80 dark:border-red-950/60 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 text-xs font-bold py-2 px-4 rounded-full shadow-2xl z-50 animate-in fade-in duration-150 whitespace-nowrap ${
          toastMessage.type === "success" 
            ? "bg-emerald-700 text-white" 
            : "bg-red-700 text-white"
        }`}>
          {toastMessage.text}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink uppercase tracking-wider text-[11px]">
              Danger Zone: Unsettled Bills Management
            </h2>
            <p className="text-xs text-ink-mute">
              Delete unsettled bills and cascade-purge associated payment transactions
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-700">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
          {bills.length} Unsettled
        </span>
      </div>

      {/* Bills List */}
      {bills.length === 0 ? (
        <div className="bg-canvas-soft border border-hairline rounded-xl p-4 text-center text-xs text-ink-mute flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>All clear! No unsettled bills found. Every bill is completely settled.</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bills.map(bill => {
            const hasTransactions = bill.transactionsCount > 0;
            const dateStr = bill.date 
              ? new Date(bill.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "—";

            return (
              <div 
                key={bill._id} 
                className="bg-canvas-soft/70 border border-hairline rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-red-200 transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-ink text-sm truncate">{bill.title}</h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-canvas text-ink-mute border border-hairline">
                      <Clock className="w-2.5 h-2.5 text-amber-600" />
                      <span>{bill.status === "PARTIALLY_PAID" ? "Partially Paid" : "Open"}</span>
                    </span>
                    <span className="text-xs font-black text-ink">
                      {formatMoney(bill.totalAmountPaise)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-ink-mute flex-wrap">
                    <span>{dateStr}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3 text-ink-faint" />
                      {bill.splitsCount} split(s)
                    </span>
                    <span>•</span>
                    {hasTransactions ? (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <CreditCard className="w-3 h-3" />
                        {bill.transactionsCount} transaction(s) ({formatMoney(bill.transactionsAmountPaise)} collected)
                      </span>
                    ) : (
                      <span className="text-ink-faint">0 transactions</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => openDeleteModal(bill)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-canvas hover:bg-red-50 text-red-600 active:scale-95 text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Bill</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Proper Warning Confirmation Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-canvas p-5 sm:p-6 rounded-2xl max-w-lg w-full shadow-2xl border border-hairline space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-ink text-base">Permanently Delete Bill</h3>
                  <p className="text-xs text-ink-mute">Review the consequences before proceeding</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="p-1 text-ink-mute hover:text-ink rounded-lg transition disabled:opacity-30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Bill Info */}
            <div className="bg-canvas-soft border border-hairline rounded-xl p-3.5 space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-mute">Bill Title:</span>
                <strong className="text-ink font-bold text-sm">{selectedBill.title}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-mute">Total Bill Amount:</span>
                <strong className="text-ink font-bold">{formatMoney(selectedBill.totalAmountPaise)}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-mute">Status:</span>
                <span className="font-bold text-amber-700">{selectedBill.status}</span>
              </div>
            </div>

            {/* Critical Warning Box for Transactions */}
            {selectedBill.transactionsCount > 0 ? (
              <div className="bg-red-50/80 border border-red-200 rounded-xl p-3.5 space-y-2 text-xs text-red-900">
                <div className="flex items-center gap-1.5 font-black text-red-700 uppercase tracking-wide text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Warning: Bill Has Existing Transactions!</span>
                </div>
                <p className="leading-relaxed">
                  This bill has <strong>{selectedBill.transactionsCount} recorded transaction(s)</strong> totaling <strong>{formatMoney(selectedBill.transactionsAmountPaise)}</strong>.
                </p>
                <p className="leading-relaxed text-red-800">
                  Proceeding will permanently purge:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-red-800">
                  <li><strong>{selectedBill.transactionsCount} payment transactions</strong> and verified records</li>
                  <li><strong>{selectedBill.splitsCount} member split allocations</strong></li>
                  <li><strong>{selectedBill.requestsCount} payment requests & links</strong></li>
                  <li>Recalculate member balances and dues immediately</li>
                </ul>
                <p className="font-bold text-red-700 pt-1">
                  ⚠️ This action cannot be undone or recovered.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 space-y-1.5 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Permanent Deletion Warning</span>
                </div>
                <p className="leading-relaxed">
                  This will delete the bill and its <strong>{selectedBill.splitsCount} split record(s)</strong>. Member balances will be updated.
                </p>
              </div>
            )}

            {/* Confirmation Controls */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2 text-xs text-ink cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmCheck}
                  onChange={(e) => setConfirmCheck(e.target.checked)}
                  className="mt-0.5 rounded border-hairline accent-red-600 w-4 h-4"
                />
                <span className="leading-snug text-ink-mute">
                  I understand that this unsettled bill and all its associated records will be permanently deleted.
                </span>
              </label>

              {requiresTyping && (
                <div>
                  <label className="block text-ink-mute text-[11px] font-bold uppercase tracking-wider mb-1">
                    Type <span className="text-red-600 font-mono font-black">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    placeholder="DELETE"
                    className="w-full bg-canvas text-ink border border-hairline rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-red-500 transition uppercase"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2 border-t border-hairline">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-ink-mute hover:text-ink transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!isConfirmValid || isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:pointer-events-none text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Deleting..." : "Delete Bill & Transactions"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
