import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Bill } from "@/models/Bill";
import { Split } from "@/models/Split";
import { AuditLog } from "@/models/AuditLog";
import mongoose from "mongoose";

export async function POST(req: NextRequest) {
  await dbConnect();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const data = await req.json();
    const { title, description, date, totalAmountPaise, splits } = data;

    // Create Bill
    const bill = await Bill.create([{
      title,
      description,
      date: new Date(date),
      totalAmountPaise,
      status: "OPEN"
    }], { session });

    const billId = bill[0]._id;

    // Create Splits
    const splitDocs = splits.map((s: any) => ({
      billId,
      personId: s.personId,
      originalAmountPaise: s.originalAmountPaise,
      status: "PENDING"
    }));

    await Split.insertMany(splitDocs, { session });

    // Audit Log
    await AuditLog.create([{
      action: "BILL_CREATED",
      entityType: "Bill",
      entityId: billId,
      actor: "ADMIN",
      metadata: { totalAmountPaise, splitsCount: splits.length }
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ success: true, billId });
  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
