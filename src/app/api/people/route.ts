import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Person } from "@/models/Person";
import { normalizePhone } from "@/lib/phone";

export async function GET() {
  try {
    await dbConnect();
    const people = await Person.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json({ success: true, people });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    
    // Normalize phone
    const normalizedPhone = normalizePhone(data.phone);

    const person = await Person.create({
      ...data,
      phone: normalizedPhone,
    });

    return NextResponse.json({ success: true, person });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
