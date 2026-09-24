import mongoose from "mongoose";

const PersonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PersonSchema.index({ createdAt: -1 });
PersonSchema.index({ isActive: 1, name: 1 });

export const Person = mongoose.models.Person || mongoose.model("Person", PersonSchema);
