import mongoose from "mongoose";

const PaymentTransactionSchema = new mongoose.Schema(
  {
    billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: true },
    splitId: { type: mongoose.Schema.Types.ObjectId, ref: "Split", required: true },
    personId: { type: mongoose.Schema.Types.ObjectId, ref: "Person", required: true },
    paymentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentRequest" },
    amountPaise: { type: Number, required: true },
    method: { type: String, required: true, enum: ["FAMPAY", "MANUAL"] },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "PROCESSING", "VERIFIED", "REJECTED", "UNMATCHED", "DUPLICATE"],
    },
    utr: { type: String },
    refCode: { type: String },
    transactionId: { type: String },
    senderName: { type: String },
    paymentTime: { type: Date },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    note: { type: String },
    source: { type: String, enum: ["AUTO_VERIFIED", "MANUAL"] },
    rawVerificationReference: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const PaymentTransaction = mongoose.models.PaymentTransaction || mongoose.model("PaymentTransaction", PaymentTransactionSchema);
