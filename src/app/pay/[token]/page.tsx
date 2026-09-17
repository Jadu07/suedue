import dbConnect from "@/lib/db";
import { PaymentRequest } from "@/models/PaymentRequest";
import { Bill } from "@/models/Bill";
import { Person } from "@/models/Person";
import { Split } from "@/models/Split";
import crypto from "crypto";
import LivePaymentUI from "./LivePaymentUI";

export default async function PublicPaymentPage({ params }: { params: Promise<{ token: string }> }) {
  await dbConnect();
  const { token } = await params;
  
  // Prevent treeshaking
  Bill; Person;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  
  let payReq = await PaymentRequest.findOne({ secureTokenHash: tokenHash }).populate("billId").populate("personId");
  if (!payReq) {
    payReq = await PaymentRequest.findOne({ rawToken: token }).populate("billId").populate("personId");
  }
  if (!payReq) {
    payReq = await PaymentRequest.findOne({ secureTokenHash: token }).populate("billId").populate("personId");
  }
  if (!payReq && token.match(/^[0-9a-fA-F]{24}$/)) {
    payReq = await PaymentRequest.findById(token).populate("billId").populate("personId");
  }
  
  if (!payReq) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-xl text-center">
        <div>
          <h1 className="display-lg text-ink mb-md">Payment Link Invalid</h1>
          <p className="body-md text-ink-mute">This payment link is invalid or has expired.</p>
        </div>
      </div>
    );
  }


  const person = payReq.personId;
  let billTitle = "";
  let isPaid = false;

  const { PaymentTransaction } = await import("@/models/PaymentTransaction");

  let initialUtr = payReq.userProvidedUtr || null;
  let initialDate = null;
  
  if (payReq.splitIds && payReq.splitIds.length > 0) {
    // Consolidated request
    billTitle = "Consolidated Pending Dues";
    // Check if ALL splits are paid
    const splits = await Split.find({ _id: { $in: payReq.splitIds } });
    isPaid = splits.every(s => s.status === "PAID");
    
    if (isPaid) {
      const tx = await PaymentTransaction.findOne({ splitId: { $in: payReq.splitIds }, status: "VERIFIED" }).sort({ paymentTime: -1 });
      if (tx) {
        initialUtr = tx.utr;
        initialDate = tx.paymentTime.toISOString();
      }
    }
  } else {
    // Single split request
    billTitle = payReq.billId?.title || "Payment Request";
    const split = await Split.findById(payReq.splitId);
    isPaid = split?.status === "PAID";
    
    if (isPaid) {
      const tx = await PaymentTransaction.findOne({ splitId: split?._id, status: "VERIFIED" }).sort({ paymentTime: -1 });
      if (tx) {
        initialUtr = tx.utr;
        initialDate = tx.paymentTime.toISOString();
      }
    }
  }

  let derivedStatus = payReq.status;
  if (isPaid) {
    derivedStatus = "PAID";
  } else if (payReq.status === "ACTIVE" || payReq.status === "EXPIRED") {
    // Reset expiration to 5 minutes from now whenever the user hits the link
    payReq.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    payReq.status = "ACTIVE";
    await payReq.save();
    derivedStatus = "ACTIVE";
  }

  let refCode = payReq.refCode;
  if (!refCode) {
    refCode = "SD" + payReq.secureTokenHash.slice(0, 4).toUpperCase();
    payReq.refCode = refCode;
    await payReq.save();
  }

  return (
    <div className="min-h-screen bg-canvas flex flex-col p-md md:p-huge items-center justify-center">
      <LivePaymentUI 
        token={token}
        refCode={refCode}
        billTitle={billTitle}
        personName={person.name}
        amountPaise={payReq.requestedAmountPaise}
        initialStatus={derivedStatus}
        initialUtr={initialUtr}
        initialDate={initialDate}
      />
    </div>
  );
}
