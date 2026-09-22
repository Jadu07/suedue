import { Bill } from "@/models/Bill";
import dbConnect from "@/lib/db";
import BillsListClient from "./BillsListClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await dbConnect();
  
  const bills = await Bill.find()
    .select("title description date totalAmountPaise status createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const serializableBills = bills.map((b: any) => ({
    _id: b._id.toString(),
    title: b.title,
    description: b.description || "",
    date: b.date ? b.date.toISOString() : new Date().toISOString(),
    totalAmountPaise: b.totalAmountPaise,
    status: b.status,
    createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
  }));

  return (
    <div className="p-md md:p-huge max-w-5xl mx-auto">
      <BillsListClient initialBills={serializableBills} />
    </div>
  );
}
