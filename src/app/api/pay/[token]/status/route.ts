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
    let pendingStatus = payReq.status || "PENDING";
    const { PaymentTransaction } = await import("@/models/PaymentTransaction");
    let tx = null;

    if (!isPaid) {
      if (payReq.splitIds && payReq.splitIds.length > 0) {
        const splits = await Split.find({ _id: { $in: payReq.splitIds } });
        if (splits && splits.length > 0) {
          isPaid = splits.every(s => s.status === "PAID");
        }
      } else if (payReq.splitId) {
        const split = await Split.findById(payReq.splitId);
        if (split) {
          isPaid = split.status === "PAID";
          pendingStatus = split.status;
        }
      }
    }

    if (isPaid) {
      if (payReq.splitIds && payReq.splitIds.length > 0) {
        tx = await PaymentTransaction.findOne({ splitId: { $in: payReq.splitIds }, status: "VERIFIED" }).sort({ paymentTime: -1 });
      } else if (payReq.splitId) {
        tx = await PaymentTransaction.findOne({ splitId: payReq.splitId, status: "VERIFIED" }).sort({ paymentTime: -1 });
      }

      if (payReq.status !== "COMPLETED") {
        payReq.status = "COMPLETED";
        await payReq.save();
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

    if (payReq.status === "EXPIRED" || payReq.status === "CANCELLED") {
      return NextResponse.json({ success: true, status: payReq.status });
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
    await payReq.save();

    return NextResponse.json({ success: true, message: "UTR submitted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    await dbConnect();
    const { token } = await params;
    const body = await req.json().catch(() => ({}));
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    let payReq = await PaymentRequest.findOne({ secureTokenHash: tokenHash });
    if (!payReq) payReq = await PaymentRequest.findOne({ rawToken: token });
    if (!payReq) payReq = await PaymentRequest.findOne({ secureTokenHash: token });
    if (!payReq && token.match(/^[0-9a-fA-F]{24}$/)) payReq = await PaymentRequest.findById(token);

    if (!payReq) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.status === "EXPIRED" && payReq.status !== "COMPLETED") {
      payReq.status = "EXPIRED";
      await payReq.save();
    }

    return NextResponse.json({ success: true, status: payReq.status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
