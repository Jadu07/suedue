import mongoose from "mongoose";

const BillSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    totalAmountPaise: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    category: { type: String, default: "General" },
    status: {
      type: String,
      required: true,
      enum: ["OPEN", "PARTIALLY_PAID", "PAID", "CANCELLED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

BillSchema.index({ createdAt: -1 });
BillSchema.index({ status: 1, createdAt: -1 });

export const Bill = mongoose.models.Bill || mongoose.model("Bill", BillSchema);
