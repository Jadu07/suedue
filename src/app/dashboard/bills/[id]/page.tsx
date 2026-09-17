import { Bill } from "@/models/Bill";
import { Split } from "@/models/Split";
import { Person } from "@/models/Person";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import dbConnect from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { notFound } from "next/navigation";
import BillSplitRow from "./BillSplitRow"; // Client component

export default async function BillViewPage({ params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  
  // Prevent treeshaking so Mongoose can populate
  Person;
  
  const bill = await Bill.findById(id).lean();
  if (!bill) notFound();

  const [splits, payments] = await Promise.all([
    Split.find({ billId: bill._id }).populate("personId").lean(),
    PaymentTransaction.find({ billId: bill._id, status: "VERIFIED" }).lean(),
  ]);

  return (
    <div className="p-md md:p-huge max-w-5xl mx-auto space-y-xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="display-lg text-ink mb-xs">{bill.title}</h1>
          <p className="body-md text-ink-mute">{new Date(bill.date).toLocaleDateString()} &middot; {bill.status}</p>
        </div>
        <div className="flex gap-md">
          <Link href={`/dashboard/bills/${bill._id}/edit`}>
            <Button className="btn-secondary-outline">Edit</Button>
          </Link>
          <Link href="/dashboard">
            <Button className="btn-secondary-outline">&larr; Back to Bills</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
        <div className="bg-canvas-soft border border-hairline p-lg rounded-md">
          <p className="micro text-ink-mute uppercase tracking-wider mb-xs">Total Amount</p>
          <p className="display-md text-ink">{formatMoney(bill.totalAmountPaise)}</p>
        </div>
      </div>

      <div className="bg-canvas border border-hairline rounded-lg overflow-hidden overflow-x-auto">
        <div className="px-lg py-md border-b border-hairline bg-canvas-soft flex justify-between items-center">
          <h3 className="heading-lg text-ink">Splits</h3>
        </div>
        <div className="divide-y divide-hairline">
          {splits.map(split => {
            const splitPayments = payments.filter(p => p.splitId.toString() === split._id.toString());
            const totalPaidPaise = splitPayments.reduce((sum, p) => sum + p.amountPaise, 0);
            const remainingPaise = split.originalAmountPaise - totalPaidPaise;

            return (
              <BillSplitRow 
                key={split._id.toString()}
                split={JSON.parse(JSON.stringify(split))}
                person={JSON.parse(JSON.stringify(split.personId))}
                totalPaidPaise={totalPaidPaise}
                remainingPaise={remainingPaise}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
