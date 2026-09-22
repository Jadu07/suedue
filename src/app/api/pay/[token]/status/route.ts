import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { PaymentRequest } from "@/models/PaymentRequest";
import { Split } from "@/models/Split";
import crypto from "crypto";

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await dbConnect();
    const { token } = await params;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    let payReq = await PaymentRequest.findOne({ secureTokenHash: tokenHash });
    if (!payReq) {
      payReq = await PaymentRequest.findOne({ rawToken: token });
    }
    if (!payReq) {
      payReq = await PaymentRequest.findOne({ secureTokenHash: token });
    }
    if (!payReq && token.match(/^[0-9a-fA-F]{24}$/)) {
      payReq = await PaymentRequest.findById(token);
    }
    if (!payReq) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let isPaid = payReq.status === "COMPLETED";
    const pendingStatus = payReq.status || "PENDING";
    const { PaymentTransaction } = await import("@/models/PaymentTransaction");
    let tx = null;

    const sIds = (payReq.splitIds && payReq.splitIds.length > 0) ? payReq.splitIds : (payReq.splitId ? [payReq.splitId] : []);

    // 1. Check if splits are already marked PAID
    if (!isPaid && sIds.length > 0) {
      const splits = await Split.find({ _id: { $in: sIds } });
      if (splits && splits.length > 0) {
        isPaid = splits.every(s => s.status === "PAID");
      }
    }

    // 2. Check if a VERIFIED transaction exists for this refCode, split, or paymentRequestId
    if (!isPaid) {
      const orConditions: any[] = [{ paymentRequestId: payReq._id }];
      if (sIds.length > 0) orConditions.push({ splitId: { $in: sIds } });
      if (payReq.refCode) orConditions.push({ refCode: payReq.refCode });
      if (payReq.userProvidedUtr) orConditions.push({ utr: payReq.userProvidedUtr });

      tx = await PaymentTransaction.findOne({
        $or: orConditions,
        status: "VERIFIED"
      }).sort({ paymentTime: -1 });

      if (tx) {
        isPaid = true;
      }
    }

    if (isPaid) {
      if (!tx) {
        const orConditions: any[] = [{ paymentRequestId: payReq._id }];
        if (sIds.length > 0) orConditions.push({ splitId: { $in: sIds } });
        if (payReq.refCode) orConditions.push({ refCode: payReq.refCode });
        if (payReq.userProvidedUtr) orConditions.push({ utr: payReq.userProvidedUtr });

        tx = await PaymentTransaction.findOne({
          $or: orConditions,
          status: "VERIFIED"
        }).sort({ paymentTime: -1 });
      }

      if (payReq.status !== "COMPLETED") {
        payReq.status = "COMPLETED";
        await payReq.save();
      }

      // Ensure splits are updated
      if (sIds.length > 0) {
        await Split.updateMany({ _id: { $in: sIds } }, { $set: { status: "PAID" } });
      }

      let paymentTimeIso = new Date().toISOString();
      if (tx?.paymentTime) {
        try {
          const d = new Date(tx.paymentTime);
          if (!isNaN(d.getTime())) paymentTimeIso = d.toISOString();
        } catch {}
      }

      return NextResponse.json({ 
        success: true, 
        status: "PAID",
        utr: tx?.utr || payReq.userProvidedUtr || "N/A",
        paymentTime: paymentTimeIso
      });
    }

    return NextResponse.json({ success: true, status: pendingStatus });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await dbConnect();
    const { token } = await params;
    const { utr } = await req.json();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    
    let payReq = await PaymentRequest.findOne({ secureTokenHash: tokenHash });
    if (!payReq) payReq = await PaymentRequest.findOne({ rawToken: token });
    if (!payReq) payReq = await PaymentRequest.findOne({ secureTokenHash: token });
    if (!payReq && token.match(/^[0-9a-fA-F]{24}$/)) payReq = await PaymentRequest.findById(token);

    if (!payReq) return NextResponse.json({ error: "Not found" }, { status: 404 });

    payReq.userProvidedUtr = utr;
    payReq.verificationStatus = "IDLE";
    await payReq.save();

    return NextResponse.json({ success: true, message: "UTR submitted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
