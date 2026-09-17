import mongoose from "mongoose";

const BillSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    totalAmountPaise: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      required: true,
      enum: ["OPEN", "PARTIALLY_PAID", "PAID", "CANCELLED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

export const Bill = mongoose.models.Bill || mongoose.model("Bill", BillSchema);
