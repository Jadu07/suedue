import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { WhatsAppMessage } from "@/models/WhatsAppMessage";
import { Split } from "@/models/Split";
import { Person } from "@/models/Person";
import { Bill } from "@/models/Bill";
import { PaymentRequest } from "@/models/PaymentRequest";
import { toRupees, formatMoney } from "@/lib/money";
import crypto from "crypto";
import axios from "axios";

import { formatSplitTitleWithDate } from "@/lib/whatsappDate";
import { getIncludeYearPreference } from "@/lib/whatsappSettings";

import { PaymentTransaction } from "@/models/PaymentTransaction";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { splitId } = await req.json();

    // Prevent treeshaking
    Person; Bill;

    const split = await Split.findById(splitId).populate("personId").populate("billId");
    if (!split) throw new Error("Split not found");

    const person = split.personId;
    const bill = split.billId;

    // Calculate actual remaining amount (in case of partial payments)
    const existingPayments = await PaymentTransaction.find({ splitId: split._id, status: "VERIFIED" });
    const totalPaid = existingPayments.reduce((acc, p) => acc + p.amountPaise, 0);
    const remainingPaise = split.originalAmountPaise - totalPaid;

    if (remainingPaise <= 0) {
      return NextResponse.json({ error: "This split is already fully paid." }, { status: 400 });
    }

    // Generate secure token for payment link
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Invalidate old active requests for this split to avoid overlap
    await PaymentRequest.updateMany(
      { 
        personId: person._id, 
        status: "ACTIVE",
        $or: [
          { splitId: split._id },
          { splitIds: split._id }
        ]
      },
      { $set: { status: "CANCELLED" } }
    );

    // Create payment request
    const payReq = await PaymentRequest.create({
      splitId: split._id,
      personId: person._id,
      billId: bill._id,
      requestedAmountPaise: remainingPaise, 
      secureTokenHash: hash,
      rawToken: rawToken,
      refCode: "SD" + crypto.randomBytes(2).toString("hex").toUpperCase(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000"}/pay/${rawToken}`;
    
    const includeYear = await getIncludeYearPreference();
    const titleWithDate = formatSplitTitleWithDate(bill.title, bill.date, includeYear);
    
    const messageText = `Hi *${person.name}*,
Please pay *${formatMoney(remainingPaise)}* for *${titleWithDate}*.

🔗 Pay here:
${paymentLink}

_Powered by suedue_`;

    // Save WhatsApp message log
    const waMsg = await WhatsAppMessage.create({
      personId: person._id,
      billId: bill._id,
      splitId: split._id,
      paymentRequestId: payReq._id,
      phone: person.phone,
      message: messageText,
      status: "PENDING"
    });

    // Call OpenWA API
    const openwaUrl = process.env.OPENWA_URL;
    const openwaKey = process.env.OPENWA_API_KEY;

    if (openwaUrl && openwaKey) {
      try {
        // Strip non-numeric characters
        let cleanPhone = person.phone.replace(/\D/g, "");
        
        // Prepend country code if missing
        if (cleanPhone.length === 10) {
          cleanPhone = "91" + cleanPhone;
        }

        const baseUrl = openwaUrl.replace(/\/$/, ""); // Remove trailing slash
        const sessionId = process.env.OPENWA_SESSION_ID || "session";
        
        // Smart fallback: Different open-source WhatsApp APIs use different routes and payloads.
        // We will try the most common ones until one succeeds.
        // SecretCircle uses WAHA (WhatsApp HTTP API).
        // The endpoint for sending text messages is: /api/sessions/{sessionId}/messages/send-text
        const endpointsToTry = [
          { url: `${baseUrl}/api/sessions/${sessionId}/messages/send-text`, payload: { chatId: `${cleanPhone}@c.us`, text: messageText } },
          // Legacy WAHA fallback
          { url: `${baseUrl}/api/${sessionId}/sendText`, payload: { chatId: `${cleanPhone}@c.us`, text: messageText } }
        ];

        let success = false;
        let lastError = null;
        let logs: any[] = [];

        for (const ep of endpointsToTry) {
          try {
            const response = await axios.post(ep.url, ep.payload, {
              headers: { 
                "X-Api-Key": openwaKey, // WAHA strictly uses X-Api-Key
                "Authorization": `Bearer ${openwaKey}`,
                "Content-Type": "application/json",
                "Accept": "application/json"
              }
            });
            waMsg.status = "SENT";
            waMsg.providerMessageId = response.data?.messageId || response.data?.id || response.data?.key?.id;
            waMsg.sentAt = new Date();
            success = true;
            console.log(`✅ Successfully sent WhatsApp message via ${ep.url}`);
            break;
          } catch (err: any) {
            lastError = err;
            const errData = err.response?.data || err.message;
            const errStatus = err.response?.status || 'No Status';
            console.log(`❌ Failed at ${ep.url} [${errStatus}]:`, errData);
            logs.push({ url: ep.url, status: errStatus, error: errData });
            
            // If it's a 400 Bad Request, the endpoint is CORRECT but payload is wrong!
            // If it's 401/403, it's correct endpoint but auth failed!
            if (errStatus === 400 || errStatus === 401 || errStatus === 403 || errStatus === 422) {
              console.log("Found correct endpoint but payload/auth failed. Stopping search.");
              break;
            }
          }
        }

        if (!success) {
          waMsg.status = "FAILED";
          waMsg.error = JSON.stringify(logs);
          await waMsg.save();
          return NextResponse.json({ 
            success: false, 
            error: "WhatsApp server rejected the request.",
            logs
          }, { status: 500 });
        }
        
      } catch (err: any) {
        waMsg.status = "FAILED";
        waMsg.error = err.message;
        await waMsg.save();
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }
      await waMsg.save();
    } else {
      // Mocking for development if keys aren't present
      waMsg.status = "SENT";
      waMsg.sentAt = new Date();
      await waMsg.save();
      console.log("Mock WhatsApp message sent to", person.phone);
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
