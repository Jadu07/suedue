import { PaymentTransaction } from "@/models/PaymentTransaction";
import { Person } from "@/models/Person";
import { Bill } from "@/models/Bill";
import dbConnect from "@/lib/db";
import PaymentsClient from "./PaymentsClient";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  await dbConnect();
  
  // Prevent treeshaking
  Person; Bill;

  const payments = await PaymentTransaction.find()
    .populate("personId")
    .populate("billId")
    .sort({ createdAt: -1 })
    .lean();

  // Clean serialization for client component
  const serializablePayments = payments.map((p: any) => ({
    _id: p._id.toString(),
    amountPaise: p.amountPaise,
    method: p.method,
    status: p.status,
    utr: p.utr || null,
    refCode: p.refCode || null,
    senderName: p.senderName || null,
    paymentTime: p.paymentTime ? p.paymentTime.toISOString() : null,
    createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
    personId: p.personId ? {
      _id: p.personId._id.toString(),
      name: p.personId.name,
      phone: p.personId.phone,
    } : null,
    billId: p.billId ? {
      _id: p.billId._id.toString(),
      title: p.billId.title,
    } : null,
  }));

  return (
    <div className="p-md md:p-huge max-w-6xl mx-auto">
      <PaymentsClient initialPayments={serializablePayments} />
    </div>
  );
}
