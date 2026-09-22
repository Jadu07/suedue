import mongoose from "mongoose";

const PaymentRequestSchema = new mongoose.Schema(
  {
    splitId: { type: mongoose.Schema.Types.ObjectId, ref: "Split", required: false },
    splitIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Split" }],
    personId: { type: mongoose.Schema.Types.ObjectId, ref: "Person", required: true },
    billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: false },
    requestedAmountPaise: { type: Number, required: true },
    secureTokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      required: true,
      enum: ["ACTIVE", "EXPIRED", "COMPLETED", "CANCELLED"],
      default: "ACTIVE",
    },
    verificationStatus: {
      type: String,
      enum: ["IDLE", "PROCESSING", "VERIFIED"],
      default: "IDLE",
    },
    userProvidedUtr: { type: String, default: null },
    refCode: { type: String, uppercase: true, trim: true },
    rawToken: { type: String },
  },
  { timestamps: true }
);

export const PaymentRequest = mongoose.models.PaymentRequest || mongoose.model("PaymentRequest", PaymentRequestSchema);
