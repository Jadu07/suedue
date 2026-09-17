import { Bill } from "@/models/Bill";
import { Split } from "@/models/Split";
import { Person } from "@/models/Person";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import dbConnect from "@/lib/db";
import { formatMoney } from "@/lib/money";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";
import BillSplitRow from "./BillSplitRow";

export default async function BillViewPage({ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  
  // Prevent treeshaking so Mongoose can populate
  Person;
  
  const bill = await Bill.findById(id).lean();
  if (!bill) notFound();

  const [splits, payments] = await Promise.all([
    Split.find({ billId: bill._id }).populate("personId").lean(),
    PaymentTransaction.find({ billId: bill._id, status: "VERIFIED" }).lean(),
  ]);

  const totalAmountPaise = bill.totalAmountPaise || 0;
  const totalPaidPaise = payments.reduce((sum: number, p: any) => sum + (p.amountPaise || 0), 0);
  const remainingPaise = Math.max(0, totalAmountPaise - totalPaidPaise);

  const settledSplitsCount = splits.filter((s: any) => {
    const sPayments = payments.filter((p: any) => p.splitId.toString() === s._id.toString());
    const sPaid = sPayments.reduce((sum: number, p: any) => sum + (p.amountPaise || 0), 0);
    return sPaid >= s.originalAmountPaise;
  }).length;

  const dateObj = bill.date ? new Date(bill.date) : null;
  const formattedDate = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : bill.date ? String(bill.date).split("T")[0] : "—";

  const isPaid = bill.status === "PAID" || remainingPaise === 0;
  const isPartial = bill.status === "PARTIALLY_PAID" || (totalPaidPaise > 0 && remainingPaise > 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-5">
      {/* Top Back Navigation */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink active:scale-95 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Bills</span>
        </Link>
      </div>

      {/* Bill Header Card */}
      <div className="bg-canvas border border-hairline rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight break-words">
                {bill.title}
              </h1>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                  isPaid
                    ? "bg-canvas-soft text-ink border border-hairline"
                    : isPartial
                    ? "bg-canvas-soft text-ink-mute border border-hairline"
                    : "bg-canvas text-ink-mute border border-hairline"
                }`}
              >
                {isPaid ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Settled</span>
                  </>
                ) : isPartial ? (
                  <>
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>Partially Paid</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-ink-mute" />
                    <span>Pending</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-mute flex-wrap">
              <span>{formattedDate}</span>
              {bill.description && (
                <>
                  <span className="text-hairline">|</span>
                  <span className="truncate">{bill.description}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start">
            <Link href={`/dashboard/bills/${bill._id}/edit`}>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-canvas hover:bg-canvas-soft border border-hairline active:scale-95 rounded-xl text-xs font-bold text-ink transition shadow-2xs">
                <Pencil className="w-3.5 h-3.5 text-ink-mute" />
                <span>Edit Bill</span>
              </button>
            </Link>
          </div>
        </div>

        {/* 3-Metric Overview */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-5 pt-4 border-t border-hairline/80">
          <div className="bg-canvas-soft/70 border border-hairline p-3 sm:p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] text-ink-mute uppercase tracking-wider font-bold block truncate">
              Total Amount
            </span>
            <p className="text-base sm:text-2xl font-black text-ink mt-1 truncate">
              {formatMoney(totalAmountPaise)}
            </p>
          </div>
          <div className="bg-canvas-soft/70 border border-hairline p-3 sm:p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] text-ink-mute uppercase tracking-wider font-bold block truncate">
              Collected
            </span>
            <p className="text-base sm:text-2xl font-black text-emerald-600 mt-1 truncate">
              {formatMoney(totalPaidPaise)}
            </p>
          </div>
          <div className="bg-canvas-soft/70 border border-hairline p-3 sm:p-4 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] sm:text-[11px] text-ink-mute uppercase tracking-wider font-bold block truncate">
              Remaining
            </span>
            <p className="text-base sm:text-2xl font-black text-ink mt-1 truncate">
              {formatMoney(remainingPaise)}
            </p>
          </div>
        </div>
      </div>

      {/* Splits Card */}
      <div className="bg-canvas border border-hairline rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 sm:px-5 py-3.5 border-b border-hairline bg-canvas-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-ink-mute" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-ink">
              Splits ({splits.length})
            </h3>
          </div>
          <span className="text-xs text-ink-mute font-semibold">
            {settledSplitsCount} of {splits.length} settled
          </span>
        </div>

        <div className="divide-y divide-hairline">
          {splits.map((split) => {
            const splitPayments = payments.filter((p: any) => p.splitId.toString() === split._id.toString());
            const splitPaidPaise = splitPayments.reduce((sum: number, p: any) => sum + (p.amountPaise || 0), 0);
            const splitRemainingPaise = Math.max(0, split.originalAmountPaise - splitPaidPaise);

            return (
              <BillSplitRow
                key={split._id.toString()}
                split={JSON.parse(JSON.stringify(split))}
                person={JSON.parse(JSON.stringify(split.personId))}
                totalPaidPaise={splitPaidPaise}
                remainingPaise={splitRemainingPaise}
              />
            );
          })}

          {splits.length === 0 && (
            <div className="p-8 text-center text-xs text-ink-mute">
              No splits configured for this bill.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
