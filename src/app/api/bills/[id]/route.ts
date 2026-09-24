import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Bill } from "@/models/Bill";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  try {
    await dbConnect();
    const bill = await Bill.findById(id);
    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    return NextResponse.json({ success: true, bill });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  try {
    await dbConnect();
    const data = await req.json();
    
    // Only allow updating basic details to avoid breaking calculations
    const updateData: any = {
      title: data.title,
      description: data.description,
      date: new Date(data.date)
    };
    if (data.category) {
      updateData.category = data.category;
    }

    const bill = await Bill.findByIdAndUpdate(id, updateData, { new: true });
    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

    return NextResponse.json({ success: true, bill });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const { Split } = await import("@/models/Split");
    const { PaymentTransaction } = await import("@/models/PaymentTransaction");
    const { PaymentRequest } = await import("@/models/PaymentRequest");
    const { WhatsAppMessage } = await import("@/models/WhatsAppMessage");
    const { AuditLog } = await import("@/models/AuditLog");

    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const force = req.nextUrl.searchParams.get("force") === "true";
    if (bill.status === "PAID" && !force) {
      return NextResponse.json(
        { error: "Cannot delete a settled bill. Only unsettled bills (OPEN or PARTIALLY_PAID) can be deleted." },
        { status: 400 }
      );
    }

    // 1. Gather all split IDs for this bill
    const splits = await Split.find({ billId: bill._id });
    const splitIds = splits.map(s => s._id);

    // 2. Build filters for all cascading relations
    const txFilter = { $or: [{ billId: bill._id }, { splitId: { $in: splitIds } }] };
    const reqFilter = { $or: [{ billId: bill._id }, { splitId: { $in: splitIds } }, { splitIds: { $in: splitIds } }] };
    const waFilter = { $or: [{ billId: bill._id }, { splitId: { $in: splitIds } }] };

    // 3. Count documents to be deleted for auditing & confirmation
    const deletedTransactionsCount = await PaymentTransaction.countDocuments(txFilter);
    const deletedRequestsCount = await PaymentRequest.countDocuments(reqFilter);
    const deletedWhatsAppCount = await WhatsAppMessage.countDocuments(waFilter);
    const deletedSplitsCount = splits.length;

    // 4. Cascade purge all related data
    await PaymentTransaction.deleteMany(txFilter);
    await PaymentRequest.deleteMany(reqFilter);
    await WhatsAppMessage.deleteMany(waFilter);
    await Split.deleteMany({ billId: bill._id });
    await Bill.findByIdAndDelete(bill._id);

    // 5. Create immutable audit log entry
    await AuditLog.create({
      action: "BILL_DELETED",
      entityType: "Bill",
      entityId: bill._id,
      actor: "ADMIN",
      metadata: {
        title: bill.title,
        totalAmountPaise: bill.totalAmountPaise,
        status: bill.status,
        deletedTransactionsCount,
        deletedSplitsCount,
        deletedRequestsCount,
        deletedWhatsAppCount
      }
    });

    return NextResponse.json({
      success: true,
      message: `Bill "${bill.title}" and ${deletedTransactionsCount} linked transaction(s) were permanently deleted.`,
      deletedCounts: {
        transactions: deletedTransactionsCount,
        splits: deletedSplitsCount,
        requests: deletedRequestsCount,
        whatsApp: deletedWhatsAppCount
      }
    });
  } catch (err: any) {
    console.error("Error deleting bill:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
