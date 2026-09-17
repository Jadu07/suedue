import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { Person } from "@/models/Person";
import { normalizePhone } from "@/lib/phone";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const person = await Person.findById(id);
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });
    return NextResponse.json({ success: true, person });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const data = await req.json();
    
    if (data.phone) {
      data.phone = normalizePhone(data.phone);
    }

    const person = await Person.findByIdAndUpdate(id, data, { new: true });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    return NextResponse.json({ success: true, person });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    // We shouldn't actually delete people if they are in bills, better to just deactivate them
    const person = await Person.findByIdAndUpdate(id, { isActive: false }, { new: true });
    return NextResponse.json({ success: true, person });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
