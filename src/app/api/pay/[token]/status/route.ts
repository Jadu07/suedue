import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { PaymentRequest } from "@/models/PaymentRequest";
import { Split } from "@/models/Split";
import crypto from "crypto";
import axios from "axios";

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


    let isPaid = false;
    let pendingStatus = "PENDING";
    const { PaymentTransaction } = await import("@/models/PaymentTransaction");
    let tx = null;

    if (payReq.splitIds && payReq.splitIds.length > 0) {
      const splits = await Split.find({ _id: { $in: payReq.splitIds } });
      if (!splits || splits.length === 0) return NextResponse.json({ error: "Splits not found" }, { status: 404 });
      isPaid = splits.every(s => s.status === "PAID");
      if (isPaid) {
        tx = await PaymentTransaction.findOne({ splitId: { $in: payReq.splitIds }, status: "VERIFIED" }).sort({ paymentTime: -1 });
      }
    } else {
      const split = await Split.findById(payReq.splitId);
      if (!split) return NextResponse.json({ error: "Split not found" }, { status: 404 });
      isPaid = split.status === "PAID";
      pendingStatus = split.status;
      if (isPaid) {
        tx = await PaymentTransaction.findOne({ splitId: split._id, status: "VERIFIED" }).sort({ paymentTime: -1 });
      }
    }

    if (isPaid) {
      if (payReq.status !== "COMPLETED") {
        payReq.status = "COMPLETED";
        await payReq.save();
      }

      return NextResponse.json({ 
        success: true, 
        status: "PAID",
        utr: tx?.utr || payReq.userProvidedUtr || "N/A",
        paymentTime: tx?.paymentTime || new Date()
      });
    }

    // Ping removed. Verification is now triggered explicitly by UI to prevent infinite hanging.

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
    
    const payReq = await PaymentRequest.findOne({ secureTokenHash: tokenHash });
    if (!payReq) return NextResponse.json({ error: "Not found" }, { status: 404 });

    payReq.userProvidedUtr = utr;
    await payReq.save();

    return NextResponse.json({ success: true, message: "UTR submitted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
