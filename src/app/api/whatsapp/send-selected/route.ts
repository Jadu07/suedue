import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { WhatsAppMessage } from "@/models/WhatsAppMessage";
import { Split } from "@/models/Split";
import { Person } from "@/models/Person";
import { Bill } from "@/models/Bill";
import { PaymentRequest } from "@/models/PaymentRequest";
import { PaymentTransaction } from "@/models/PaymentTransaction";
import { toRupees, formatMoney } from "@/lib/money";
import crypto from "crypto";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    Bill; Person;
    const { personId, splitIds } = await req.json();

    if (!splitIds || splitIds.length === 0) {
      return NextResponse.json({ error: "No splits selected." }, { status: 400 });
    }

    const person = await Person.findById(personId);
    if (!person) throw new Error("Person not found");

    const pendingSplits = await Split.find({ 
      _id: { $in: splitIds }, 
      personId, 
      status: { $in: ["PENDING", "PARTIALLY_PAID"] } 
    }).populate("billId");
    
    if (pendingSplits.length === 0) {
      return NextResponse.json({ error: "No pending dues found for selected splits." }, { status: 400 });
    }

    let totalRemainingPaise = 0;
    const splitDetails = [];
    const finalSplitIds = [];

    for (const split of pendingSplits) {
      const existingPayments = await PaymentTransaction.find({ splitId: split._id, status: "VERIFIED" });
      const totalPaid = existingPayments.reduce((acc, p) => acc + p.amountPaise, 0);
      const remainingPaise = split.originalAmountPaise - totalPaid;
      
      if (remainingPaise !== 0) {
        totalRemainingPaise += remainingPaise;
        const bDate = split.billId?.date ? new Date(split.billId.date) : (split.createdAt ? new Date(split.createdAt) : null);
        const dateStr = bDate && !isNaN(bDate.getTime())
          ? bDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
          : "";

        const title = (split.billId?.title || "Bill").trim();
        const hasDateAlready = dateStr && title.toLowerCase().includes(dateStr.toLowerCase());
        const dateSuffix = (dateStr && !hasDateAlready) ? ` ${dateStr}` : "";

        const lineText = remainingPaise < 0 
          ? `• ${title}${dateSuffix}: -${formatMoney(Math.abs(remainingPaise))} (Credit)`
          : `• ${title}${dateSuffix}: ${formatMoney(remainingPaise)}`;
        splitDetails.push(lineText);
        finalSplitIds.push(split._id);
      }
    }

    if (totalRemainingPaise <= 0) {
      return NextResponse.json({ error: "No pending dues for selected splits (net balance is zero or credit)." }, { status: 400 });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Invalidate old active requests for these splits to avoid overlap
    await PaymentRequest.updateMany(
      { 
        personId: person._id, 
        status: "ACTIVE",
        $or: [
          { splitId: { $in: finalSplitIds } },
          { splitIds: { $elemMatch: { $in: finalSplitIds } } }
        ]
      },
      { $set: { status: "CANCELLED" } }
    );

    const payReq = await PaymentRequest.create({
      personId: person._id,
      splitIds: finalSplitIds,
      requestedAmountPaise: totalRemainingPaise, 
      secureTokenHash: hash,
      rawToken: rawToken,
      refCode: "SD" + crypto.randomBytes(2).toString("hex").toUpperCase(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000"}/pay/${rawToken}`;
    
    // Compose clean message with date on right side of bill
    const messageText = `Hi *${person.name}*,
You have pending dues of *${formatMoney(totalRemainingPaise)}*.

*Breakdown:*
${splitDetails.join("\n")}

🔗 Pay all at once here:
${paymentLink}

_Powered by suedue_`;

    const waMsg = await WhatsAppMessage.create({
      personId: person._id,
      phone: person.phone,
      message: messageText,
      status: "PENDING"
    });

    const openwaUrl = process.env.OPENWA_URL;
    const openwaKey = process.env.OPENWA_API_KEY;

    if (openwaUrl && openwaKey) {
      try {
        let cleanPhone = person.phone.replace(/\D/g, "");
        if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

        const baseUrl = openwaUrl.replace(/\/$/, "");
        const sessionId = process.env.OPENWA_SESSION_ID || "session";
        const endpointsToTry = [
          { url: `${baseUrl}/api/sessions/${sessionId}/messages/send-text`, payload: { chatId: `${cleanPhone}@c.us`, text: messageText } },
          { url: `${baseUrl}/api/${sessionId}/sendText`, payload: { chatId: `${cleanPhone}@c.us`, text: messageText } }
        ];

        let success = false;
        let logs: any[] = [];
        for (const ep of endpointsToTry) {
          try {
            await axios.post(ep.url, ep.payload, {
              headers: { 
                "X-Api-Key": openwaKey, 
                "Authorization": `Bearer ${openwaKey}`,
                "Content-Type": "application/json"
              }
            });
            waMsg.status = "SENT";
            waMsg.sentAt = new Date();
            success = true;
            break;
          } catch (err: any) {
            logs.push({ url: ep.url, status: err.response?.status, error: err.response?.data });
            if ([400, 401, 403, 422].includes(err.response?.status)) break;
          }
        }

        if (!success) {
          waMsg.status = "FAILED";
          waMsg.error = JSON.stringify(logs);
          await waMsg.save();
          return NextResponse.json({ success: false, error: "WhatsApp rejected request", logs }, { status: 500 });
        }
      } catch (err: any) {
        waMsg.status = "FAILED";
        waMsg.error = err.message;
        await waMsg.save();
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
      await waMsg.save();
    } else {
      waMsg.status = "SENT";
      waMsg.sentAt = new Date();
      await waMsg.save();
    }

    return NextResponse.json({ 
      success: true, 
      messageId: waMsg._id,
      paymentLink,
      rawToken,
      refCode: payReq.refCode,
      messageText
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
