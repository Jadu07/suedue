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
  
  const invalidLinkScreen = (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-xl text-center">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-sm tracking-tight">INVALID LINK</h1>
        <p className="text-sm text-ink-mute">This payment link is invalid or has expired.</p>
      </div>
    </div>
  );

  if (!payReq) {
    return invalidLinkScreen;
  }

  const person = payReq.personId;
  const personName = (person && typeof person === "object" && "name" in person && person.name)
    ? String(person.name)
    : "Friend";

  let billTitle = "";
  let isPaid = payReq.status === "COMPLETED";

  const { PaymentTransaction } = await import("@/models/PaymentTransaction");

  let initialUtr = payReq.userProvidedUtr || null;
  let initialDate: string | null = null;
  
  if (payReq.splitIds && payReq.splitIds.length > 0) {
    // Consolidated request
    billTitle = "Consolidated Pending Dues";
    const splits = await Split.find({ _id: { $in: payReq.splitIds } });
    if (splits && splits.length > 0) {
      isPaid = isPaid || splits.every(s => s.status === "PAID");
    }
    
    if (isPaid) {
      const tx = await PaymentTransaction.findOne({ splitId: { $in: payReq.splitIds }, status: "VERIFIED" }).sort({ paymentTime: -1 });
      if (tx) {
        initialUtr = tx.utr || initialUtr;
        if (tx.paymentTime) {
          try {
            const d = new Date(tx.paymentTime);
            if (!isNaN(d.getTime())) {
              initialDate = d.toISOString();
            }
          } catch {
            initialDate = null;
          }
        }
      }
    }
  } else {
    // Single split request
    billTitle = payReq.billId?.title || "Payment Request";
    const split = payReq.splitId ? await Split.findById(payReq.splitId) : null;
    isPaid = isPaid || split?.status === "PAID";
    
    if (isPaid) {
      const tx = await PaymentTransaction.findOne({ splitId: split?._id, status: "VERIFIED" }).sort({ paymentTime: -1 });
      if (tx) {
        initialUtr = tx.utr || initialUtr;
        if (tx.paymentTime) {
          try {
            const d = new Date(tx.paymentTime);
            if (!isNaN(d.getTime())) {
              initialDate = d.toISOString();
            }
          } catch {
            initialDate = null;
          }
        }
      }
    }
  }

  // Check if expired or cancelled (and not paid)
  const isExpired = payReq.status === "CANCELLED" || payReq.status === "EXPIRED" || (payReq.expiresAt && new Date() > new Date(payReq.expiresAt));
  if (!isPaid && isExpired) {
    return invalidLinkScreen;
  }

  let derivedStatus = isPaid ? "PAID" : "ACTIVE";

  let refCode = payReq.refCode;
  if (!refCode) {
    refCode = "SD" + (payReq.secureTokenHash ? payReq.secureTokenHash.slice(0, 4).toUpperCase() : "PAY");
    payReq.refCode = refCode;
    await payReq.save();
  }

  const payeeName = process.env.NEXT_PUBLIC_PAYEE_NAME || "Yashraj Chouhan";

  return (
    <div className="min-h-screen bg-canvas flex flex-col p-md md:p-huge items-center justify-center">
      <LivePaymentUI 
        token={token}
        refCode={refCode}
        billTitle={billTitle}
        personName={personName}
        amountPaise={payReq.requestedAmountPaise || 0}
        initialStatus={derivedStatus}
        initialUtr={initialUtr}
        initialDate={initialDate}
        upiId={process.env.NEXT_PUBLIC_UPI_ID || "yashrajchouhan@fam"}
        payeeName={payeeName}
      />
    </div>
  );
}
