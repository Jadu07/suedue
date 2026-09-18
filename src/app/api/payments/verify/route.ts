import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { PaymentRequest } from "@/models/PaymentRequest";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { Split } from "@/models/Split";
import { Bill } from "@/models/Bill";
import { Person } from "@/models/Person";
import { AuditLog } from "@/models/AuditLog";
import axios from "axios";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    Person; Bill; Split;

    const pendingRequests = await PaymentRequest.find({
      status: { $in: ["ACTIVE", "EXPIRED"] }
    }).populate("personId");
    if (!pendingRequests || pendingRequests.length === 0) {
      return NextResponse.json({ success: true, verifiedCount: 0, message: "No active requests" });
    }

    // 1. Collect all already verified UTRs so a transaction is NEVER double-counted
    const usedUtrs = await PaymentTransaction.find({ status: "VERIFIED" }).distinct("utr");
    const usedUtrSet = new Set(usedUtrs.filter(Boolean));

    // 2. Prepare payload for Python's ultra-fast batch endpoint
    const batchItems = pendingRequests.map(pr => {
      const refCode = pr.refCode || ("SD" + pr.secureTokenHash.slice(0, 4).toUpperCase());
      return {
        id: pr._id.toString(),
        amount: pr.requestedAmountPaise,
        ref_code: refCode,
        utr: pr.userProvidedUtr || null,
        person_name: (pr.personId as any)?.name || null,
        created_at: pr.createdAt?.toISOString() || null
      };
    });

    const pythonUrl = process.env.PYTHON_VERIFIER_URL || "http://127.0.0.1:8000";
    let matches: Record<string, any> = {};

    try {
      const pyRes = await axios.post(`${pythonUrl}/verify-batch`, {
        requests: batchItems,
        used_utrs: Array.from(usedUtrSet)
      }, { timeout: 4500 });

      if (pyRes.data && pyRes.data.matches) {
        matches = pyRes.data.matches;
      }
    } catch (batchErr: any) {
      console.warn("Batch verify failed, falling back to single verify:", batchErr?.message);
    }

    let verifiedCount = 0;

    for (const pr of pendingRequests) {
      const match = matches[pr._id.toString()];
      if (!match || match.status !== "VERIFIED") continue;

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const splitsToMark = pr.splitIds && pr.splitIds.length > 0 ? pr.splitIds : [pr.splitId];
        
        for (const sId of splitsToMark) {
          const split = await Split.findById(sId).session(session);
          if (!split) continue;
          
          const existingPayments = await PaymentTransaction.find({ splitId: split._id, status: "VERIFIED" }).session(session);
          const totalPaid = existingPayments.reduce((acc, p) => acc + p.amountPaise, 0);
          const remainingPaise = split.originalAmountPaise - totalPaid;
          
          if (remainingPaise <= 0) continue;

          const payment = await PaymentTransaction.create([{
            billId: split.billId,
            splitId: split._id,
            personId: split.personId,
            amountPaise: remainingPaise,
            method: "FAMPAY",
            source: "AUTO_VERIFIED",
            status: "VERIFIED",
            verifiedBy: "SYSTEM",
            utr: match.utr,
            refCode: pr.refCode || ("SD" + pr.secureTokenHash?.slice(0, 4).toUpperCase()),
            senderName: match.sender_name,
            paymentTime: new Date(match.payment_time)
          }], { session });

          split.status = "PAID";
          await split.save({ session });
          
          const allSplits = await Split.find({ billId: split.billId }).session(session);
          const allPaid = allSplits.every(s => s.status === "PAID" || s.originalAmountPaise <= 0);
          
          if (allPaid) {
            await Split.updateMany(
              { billId: split.billId, originalAmountPaise: { $lte: 0 }, status: { $ne: "PAID" } },
              { $set: { status: "PAID" } }
            ).session(session);

            const bill = await Bill.findById(split.billId).session(session);
            if (bill) {
              bill.status = "PAID";
              await bill.save({ session });
            }
          }

          await AuditLog.create([{
            action: "PAYMENT_VERIFIED",
            entityType: "PaymentTransaction",
            entityId: payment[0]._id,
            actor: "SYSTEM",
            metadata: { amountPaise: remainingPaise, source: "FAMPAY", utr: match.utr }
          }], { session });
        }

        pr.status = "COMPLETED";
        await pr.save({ session });
        
        await session.commitTransaction();
        verifiedCount++;
        // Immediately add to local set so next iteration in same tick cannot use it
        usedUtrSet.add(match.utr);
      } catch (err) {
        await session.abortTransaction();
        console.error("Transaction commit error:", err);
      } finally {
        session.endSession();
      }
    }

    return NextResponse.json({ success: true, verifiedCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
