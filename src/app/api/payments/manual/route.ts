import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { Split } from "@/models/Split";
import { Bill } from "@/models/Bill";
import { AuditLog } from "@/models/AuditLog";
import { toPaise } from "@/lib/money";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { splitId, billId, personId, amountRupees, note } = await req.json();
    const amountPaise = toPaise(parseFloat(amountRupees));

    // Get split
    const split = await Split.findById(splitId).session(session);
    if (!split) throw new Error("Split not found");

    // Get all verified payments for this split
    const existingPayments = await PaymentTransaction.find({ 
      splitId, 
      status: "VERIFIED" 
    }).session(session);
    
    const totalPaid = existingPayments.reduce((acc, p) => acc + p.amountPaise, 0);
    const remaining = split.originalAmountPaise - totalPaid;

    if (amountPaise > remaining) {
      throw new Error("Amount exceeds remaining balance");
    }

    // Create payment
    const payment = await PaymentTransaction.create([{
      billId,
      splitId,
      personId,
      amountPaise,
      method: "MANUAL",
      source: "MANUAL",
      status: "VERIFIED",
      verifiedBy: "ADMIN",
      note
    }], { session });

    // Update split status
    const newTotalPaid = totalPaid + amountPaise;
    if (newTotalPaid >= split.originalAmountPaise) {
      split.status = "PAID";
      // Auto-complete any active payment request linked to this split
      const { PaymentRequest } = await import("@/models/PaymentRequest");
      await PaymentRequest.updateMany(
        {
          $or: [{ splitId: split._id }, { splitIds: split._id }],
          status: "ACTIVE"
        },
        { $set: { status: "COMPLETED" } },
        { session }
      );
    } else {
      split.status = "PARTIALLY_PAID";
    }
    await split.save({ session });

    // Check if bill is fully paid
    const allSplits = await Split.find({ billId }).session(session);
    const allPaid = allSplits.every(s => s.status === "PAID");
    const anyPartiallyPaid = allSplits.some(s => s.status === "PARTIALLY_PAID" || s.status === "PAID");

    const bill = await Bill.findById(billId).session(session);
    if (bill) {
      if (allPaid) {
        bill.status = "PAID";
      } else if (anyPartiallyPaid) {
        bill.status = "PARTIALLY_PAID";
      }
      await bill.save({ session });
    }

    // Audit Log
    await AuditLog.create([{
      action: "PAYMENT_MANUALLY_ADDED",
      entityType: "PaymentTransaction",
      entityId: payment[0]._id,
      actor: "ADMIN",
      metadata: { amountPaise, note }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
