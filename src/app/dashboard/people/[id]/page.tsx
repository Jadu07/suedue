import dbConnect from "@/lib/db";
import { Person } from "@/models/Person";
import { Split } from "@/models/Split";
import { Bill } from "@/models/Bill";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { PaymentRequest } from "@/models/PaymentRequest";
import PersonDetailsTabsClient from "./PersonDetailsTabsClient";
import UserAvatar from "@/components/UserAvatar";
import { formatMoney } from "@/lib/money";
import Link from "next/link";
import { ArrowLeft, Phone, Mail } from "lucide-react";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  
  Bill; Person;

  // Run all queries in parallel with lean documents for instant loading
  const [person, allSplits, allVerifiedPayments, rawActiveRequests] = await Promise.all([
    Person.findById(id).lean(),
    Split.find({ personId: id }).populate("billId").sort({ createdAt: -1 }).lean(),
    PaymentTransaction.find({ status: "VERIFIED" }).lean(),
    PaymentRequest.find({ personId: id, status: "ACTIVE" }).sort({ createdAt: -1 }).lean(),
  ]);

  if (!person) {
    return (
      <div className="p-md md:p-huge max-w-5xl mx-auto space-y-md">
        <Link 
          href="/dashboard/people" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to People</span>
        </Link>
        <div className="bg-canvas border border-hairline rounded-xl p-xl text-center text-ink-mute">
          Person not found.
        </div>
      </div>
    );
  }

  // Pre-index verified payments by splitId (0ms in-memory lookup)
  const splitPaidMap = new Map<string, number>();
  for (const p of allVerifiedPayments) {
    if (p.splitId) {
      const sId = p.splitId.toString();
      splitPaidMap.set(sId, (splitPaidMap.get(sId) || 0) + (p.amountPaise || 0));
    }
  }

  const pendingSplitsData = [];
  const paidSplitsData = [];

  // Group splits by status and calculate exact amounts in RAM
  for (const split of allSplits) {
    if (split.status === "PAID") {
      paidSplitsData.push({
        splitId: split._id.toString(),
        billTitle: split.billId ? split.billId.title : "Bill",
        billDate: split.billId ? split.billId.date.toISOString() : split.createdAt.toISOString(),
        originalPaise: split.originalAmountPaise,
        remainingPaise: 0
      });
    } else {
      const totalPaid = splitPaidMap.get(split._id.toString()) || 0;
      const remainingPaise = split.originalAmountPaise - totalPaid;
      
      if (remainingPaise !== 0) {
        pendingSplitsData.push({
          splitId: split._id.toString(),
          billTitle: split.billId ? split.billId.title : "Bill",
          billDate: split.billId ? split.billId.date.toISOString() : split.createdAt.toISOString(),
          originalPaise: split.originalAmountPaise,
          remainingPaise: remainingPaise
        });
      }
    }
  }

  const pendingSplitIdSet = new Set(pendingSplitsData.map(s => s.splitId));
  const activeSplitIds = new Set<string>();
  const activeRequestsData = [];
  const autoHealCompletedIds: any[] = [];

  for (const req of rawActiveRequests) {
    const ids = req.splitIds && req.splitIds.length > 0 ? req.splitIds : [req.splitId];
    // Check if at least one linked split is still pending
    const stillPending = ids.some((sid: any) => sid && pendingSplitIdSet.has(sid.toString()));

    if (!stillPending) {
      autoHealCompletedIds.push(req._id);
      continue;
    }

    let linkedTitles = [];
    for (const sid of ids) {
      if (sid) {
        activeSplitIds.add(sid.toString());
        const match = allSplits.find(s => s._id.toString() === sid.toString());
        if (match && match.billId) {
          linkedTitles.push(match.billId.title);
        }
      }
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
    const paymentLink = req.rawToken ? `${appUrl}/pay/${req.rawToken}` : `${appUrl}/pay/${req._id.toString()}`;
    activeRequestsData.push({
      id: req._id.toString(),
      amountPaise: req.requestedAmountPaise,
      createdAt: req.createdAt.toISOString(),
      expiresAt: req.expiresAt.toISOString(),
      linkedBills: linkedTitles.join(", "),
      refCode: req.refCode || ("SD" + req.secureTokenHash.slice(0, 4).toUpperCase()),
      paymentLink: paymentLink
    });
  }

  // Batch auto-heal in background
  if (autoHealCompletedIds.length > 0) {
    PaymentRequest.updateMany({ _id: { $in: autoHealCompletedIds } }, { status: "COMPLETED" }).exec().catch(() => {});
  }

  const enrichedPendingSplits = pendingSplitsData.map(s => ({
    ...s,
    hasActiveLink: activeSplitIds.has(s.splitId)
  }));

  const personObj = {
    _id: person._id.toString(),
    name: person.name,
    phone: person.phone,
    email: person.email || "",
    notes: person.notes || "",
    isActive: person.isActive ?? true
  };

  const totalPendingPaise = pendingSplitsData.reduce((acc, s) => acc + s.remainingPaise, 0);

  return (
    <div className="p-md md:p-huge max-w-5xl mx-auto space-y-lg">
      {/* Back Button */}
      <div>
        <Link 
          href="/dashboard/people" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink transition py-2 touch-manipulation"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to People</span>
        </Link>
      </div>

      {/* Header Profile Card */}
      <div className="bg-canvas border border-hairline rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <UserAvatar name={person.name} size="lg" />
          <div className="min-w-0">
            <h1 className="display-md font-black text-ink tracking-tight truncate">{person.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5 text-xs text-ink-mute">
              <a href={`tel:${person.phone}`} className="flex items-center gap-1 font-mono hover:text-ink transition">
                <Phone className="w-3 h-3 text-ink-faint shrink-0" />
                {person.phone}
              </a>
              {person.email && (
                <a href={`mailto:${person.email}`} className="flex items-center gap-1 truncate hover:text-ink transition">
                  <Mail className="w-3 h-3 text-ink-faint shrink-0" />
                  {person.email}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="sm:text-right shrink-0 border-t border-hairline sm:border-0 pt-3 sm:pt-0">
          <span className="text-[10px] text-ink-mute uppercase tracking-wider font-semibold block">
            {totalPendingPaise > 0 ? "Total Dues" : "Status"}
          </span>
          <p className="text-lg sm:text-2xl font-black text-ink tracking-tight mt-0.5">
            {totalPendingPaise > 0 ? formatMoney(totalPendingPaise) : "Settled"}
          </p>
        </div>
      </div>

      {/* Tabs & Tab Content */}
      <PersonDetailsTabsClient 
        initialPerson={personObj} 
        pendingSplits={enrichedPendingSplits} 
        paidSplits={paidSplitsData}
        activeRequests={activeRequestsData}
      />
    </div>
  );
}
