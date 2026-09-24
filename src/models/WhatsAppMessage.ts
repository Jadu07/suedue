import mongoose from "mongoose";

const WhatsAppMessageSchema = new mongoose.Schema(
  {
    personId: { type: mongoose.Schema.Types.ObjectId, ref: "Person", required: true },
    billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
    splitId: { type: mongoose.Schema.Types.ObjectId, ref: "Split" },
    paymentRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentRequest" },
    phone: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, required: true, enum: ["PENDING", "SENT", "FAILED"], default: "PENDING" },
    providerMessageId: { type: String },
    error: { type: String },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

WhatsAppMessageSchema.index({ billId: 1 });
WhatsAppMessageSchema.index({ splitId: 1 });

export const WhatsAppMessage = mongoose.models.WhatsAppMessage || mongoose.model("WhatsAppMessage", WhatsAppMessageSchema);
