import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Person } from "@/models/Person";
import { Bill } from "@/models/Bill";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim() === "") {
      return NextResponse.json({ people: [], bills: [] });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    // Search People
    const people = await Person.find({
      $or: [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ],
    })
      .select("_id name phone email")
      .limit(5)
      .lean();

    // Search Bills
    const bills = await Bill.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
      ],
    })
      .select("_id title status totalAmountPaise date")
      .limit(5)
      .lean();

    return NextResponse.json({
      people: people.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        phone: p.phone,
        email: p.email,
      })),
      bills: bills.map((b: any) => ({
        id: b._id.toString(),
        title: b.title,
        status: b.status,
        amountPaise: b.totalAmountPaise,
        date: b.date,
      })),
    });
  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
