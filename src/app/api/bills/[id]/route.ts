import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Bill } from "@/models/Bill";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  try {
    await dbConnect();
    const bill = await Bill.findById(id);
    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    return NextResponse.json({ success: true, bill });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  try {
    await dbConnect();
    const data = await req.json();
    
    // Only allow updating basic details to avoid breaking calculations
    const updateData = {
      title: data.title,
      description: data.description,
      date: new Date(data.date)
    };

    const bill = await Bill.findByIdAndUpdate(id, updateData, { new: true });
    if (!bill) return NextResponse.json({ error: "Bill not found" }, { status: 404 });

    return NextResponse.json({ success: true, bill });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
