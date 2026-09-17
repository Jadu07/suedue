import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { PaymentRequest } from "@/models/PaymentRequest";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    const payReq = await PaymentRequest.findById(requestId);
    if (!payReq) {
      return NextResponse.json({ error: "Payment request not found." }, { status: 404 });
    }

    if (payReq.status !== "ACTIVE") {
      return NextResponse.json({ error: "Payment request is not active." }, { status: 400 });
    }

    payReq.status = "CANCELLED";
    await payReq.save();

    return NextResponse.json({ success: true, message: "Payment request cancelled." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
