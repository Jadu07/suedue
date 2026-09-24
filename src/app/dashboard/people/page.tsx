import dbConnect from "@/lib/db";
import { Person } from "@/models/Person";
import { Split } from "@/models/Split";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { PaymentRequest } from "@/models/PaymentRequest";
import PeopleListClient, { PersonItem } from "./PeopleListClient";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  await dbConnect();

  // Fetch all in parallel with lean documents for maximum speed
  const [people, allSplits, verifiedPayments, activeRequests] = await Promise.all([
    Person.find()
      .select("name phone email notes isActive createdAt")
      .sort({ createdAt: -1 })
      .lean(),
    Split.find({ status: { $ne: "CANCELLED" } })
      .select("_id personId status originalAmountPaise")
      .lean(),
    PaymentTransaction.find({ status: "VERIFIED" })
      .select("splitId amountPaise")
      .lean(),
    PaymentRequest.find({
      status: "ACTIVE",
      expiresAt: { $gt: new Date() }
    })
      .select("_id personId rawToken refCode secureTokenHash requestedAmountPaise expiresAt createdAt")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const appUrl = process.env.APP_URL || "http://127.0.0.1:3000";

  // Pre-calculate verified payments per splitId
  const splitPaidMap = new Map<string, number>();
  for (const p of verifiedPayments) {
    if (p.splitId) {
      const sId = p.splitId.toString();
      splitPaidMap.set(sId, (splitPaidMap.get(sId) || 0) + (p.amountPaise || 0));
    }
  }

  // Pre-calculate dues per person
  const personDuesMap = new Map<string, { pendingPaise: number; unpaidBillsCount: number; paidBillsCount: number }>();
  for (const split of allSplits) {
    const pId = split.personId.toString();
    if (!personDuesMap.has(pId)) {
      personDuesMap.set(pId, { pendingPaise: 0, unpaidBillsCount: 0, paidBillsCount: 0 });
    }
    const stat = personDuesMap.get(pId)!;
    if (split.status === "PAID") {
      stat.paidBillsCount += 1;
    } else {
      const paid = splitPaidMap.get(split._id.toString()) || 0;
      if (split.originalAmountPaise < 0) {
        // Negative split: acts as a credit/deduction against member dues
        const netDeduction = split.originalAmountPaise + paid;
        stat.pendingPaise += netDeduction; // adds negative = deducts from dues
        stat.unpaidBillsCount += 1;
      } else {
        const remaining = Math.max(0, split.originalAmountPaise - paid);
        if (remaining > 0) {
          stat.pendingPaise += remaining;
          stat.unpaidBillsCount += 1;
        } else {
          stat.paidBillsCount += 1;
        }
      }
    }
  }

  // Map latest active request per person
  const personActiveRequestMap = new Map<string, any>();
  const completedReqIds: any[] = [];
  for (const req of activeRequests) {
    const pId = req.personId.toString();
    const dues = personDuesMap.get(pId);
    if (!dues || dues.pendingPaise <= 0) {
      completedReqIds.push(req._id);
      continue;
    }
    if (!personActiveRequestMap.has(pId)) {
      const link = req.rawToken ? `${appUrl}/pay/${req.rawToken}` : `${appUrl}/pay/${req._id.toString()}`;
      personActiveRequestMap.set(pId, {
        id: req._id.toString(),
        refCode: req.refCode || ("SD" + req.secureTokenHash.slice(0, 4).toUpperCase()),
        link,
        amountPaise: req.requestedAmountPaise,
        expiresAt: req.expiresAt.toISOString(),
      });
    }
  }

  // Batch auto-heal in background without blocking render
  if (completedReqIds.length > 0) {
    PaymentRequest.updateMany({ _id: { $in: completedReqIds } }, { status: "COMPLETED" }).exec().catch(() => {});
  }

  // Build serialized people array
  const serializedPeople: PersonItem[] = people.map((p) => {
    const idStr = p._id.toString();
    const dues = personDuesMap.get(idStr) || { pendingPaise: 0, unpaidBillsCount: 0, paidBillsCount: 0 };
    const activeReq = personActiveRequestMap.get(idStr) || null;

    return {
      id: idStr,
      name: p.name,
      phone: p.phone,
      email: p.email || "",
      notes: p.notes || "",
      isActive: p.isActive ?? true,
      pendingPaise: dues.pendingPaise,
      unpaidBillsCount: dues.unpaidBillsCount,
      paidBillsCount: dues.paidBillsCount,
      activeRequest: activeReq,
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
    };
  });

  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading people...</div>}>
      <PeopleListClient initialPeople={serializedPeople} />
    </Suspense>
  );
}
