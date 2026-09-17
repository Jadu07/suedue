import mongoose from "mongoose";

const SplitSchema = new mongoose.Schema(
  {
    billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: true },
    personId: { type: mongoose.Schema.Types.ObjectId, ref: "Person", required: true },
    originalAmountPaise: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "PARTIALLY_PAID", "PAID", "CANCELLED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const Split = mongoose.models.Split || mongoose.model("Split", SplitSchema);
