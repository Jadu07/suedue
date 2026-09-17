"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

export default function LivePaymentUI({ token, refCode, billTitle, personName, amountPaise, initialStatus, initialUtr, initialDate }: any) {
  const [status, setStatus] = useState(initialStatus);
  const [timeLeft, setTimeLeft] = useState(300);
  const [utr, setUtr] = useState("");
  const [utrSubmitted, setUtrSubmitted] = useState(false);
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  const [utrError, setUtrError] = useState("");
  const [verifiedUtr, setVerifiedUtr] = useState<string | null>(initialUtr || null);
  const [paymentDate, setPaymentDate] = useState<string | null>(
    initialDate
      ? new Date(initialDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
      : null
  );
  const [showUtrForm, setShowUtrForm] = useState(false);

  const isDone = status === "PAID" || status === "COMPLETED" || status === "EXPIRED" || status === "CANCELLED";

  // --- TIMER: ticks every 1 second ---
  useEffect(() => {
    if (isDone) return;

    const id = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
          setStatus("EXPIRED");
          return 0;
        }
        return p - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [isDone]);

  // --- POLL DB STATUS: every 2.5 seconds ---
  useEffect(() => {
    if (isDone) return;

    const id = setInterval(() => {
      fetch(`/api/pay/${token}/status`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status === "PAID") {
            setStatus("PAID");
            if (data.utr) setVerifiedUtr(data.utr);
            if (data.paymentTime) {
              setPaymentDate(
                new Date(data.paymentTime).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                })
              );
            }
          }
        })
        .catch(() => {});
    }, 2500);

    return () => clearInterval(id);
  }, [isDone, token]);

  // --- INITIAL VERIFY CHECK: Run once on page mount ---
  useEffect(() => {
    if (isDone) return;
    // Check once on load in case payment already occurred
    fetch("/api/payments/verify", { method: "POST" }).catch(() => {});
  }, [isDone]);

  // --- SUBMIT UTR: Instant verification fallback for apps without notes ---
  const submitUtr = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUtr = utr.trim();
    if (cleanUtr.length !== 12 || !/^\d{12}$/.test(cleanUtr)) {
      setUtrError("Please enter a valid 12-digit numerical UTR number");
      return;
    }

    setUtrError("");
    setIsVerifyingUtr(true);

    try {
      // 1. Save UTR to PaymentRequest
      await fetch(`/api/pay/${token}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr: cleanUtr }),
      });

      // 2. Immediately trigger automated verification with this UTR and amount!
      await fetch("/api/payments/verify", { method: "POST" }).catch(() => {});

      // 3. Check status immediately
      const res = await fetch(`/api/pay/${token}/status`);
      const data = await res.json();
      if (data.status === "PAID") {
        setStatus("PAID");
        if (data.utr) setVerifiedUtr(data.utr);
        if (data.paymentTime) {
          setPaymentDate(
            new Date(data.paymentTime).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
            })
          );
        }
        setIsVerifyingUtr(false);
        return;
      }

      // If not immediately matched (e.g. email in transit), show live verifying card
      setUtrSubmitted(true);
    } catch {
      setUtrError("Error submitting UTR. Please try again.");
    } finally {
      setIsVerifyingUtr(false);
    }
  }, [token, utr]);

  // ===================== PAID / COMPLETED =====================
  if (status === "PAID" || status === "COMPLETED") {
    return (
      <div className="w-full max-w-[448px] bg-canvas-soft border border-hairline rounded-2xl shadow-xl p-xl md:p-xxl animate-in zoom-in-95 duration-500 mx-auto">
        <div className="flex justify-center mb-lg">
          <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-green-600 animate-in spin-in-12 duration-700" />
          </div>
        </div>
        <div className="text-center mb-xl">
          <h1 className="text-2xl font-semibold text-ink mb-xs">Payment Successful</h1>
          <p className="text-sm text-ink-mute">
            Thank you, {personName}. Your payment has been securely verified.
          </p>
        </div>
        <div className="bg-canvas border border-hairline rounded-xl overflow-hidden shadow-sm">
          <div className="p-md border-b border-hairline flex justify-between items-center bg-gray-50/50">
            <span className="text-sm text-ink-mute">Amount Paid</span>
            <span className="text-xl font-bold text-ink">{formatMoney(amountPaise)}</span>
          </div>
          <div className="p-md space-y-md">
            {paymentDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-mute">Date</span>
                <span className="text-sm font-medium text-ink">{paymentDate}</span>
              </div>
            )}
            {verifiedUtr && verifiedUtr !== "N/A" && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-ink-mute">UTR No.</span>
                <span className="text-sm font-mono font-medium text-ink">{verifiedUtr}</span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-xl text-center">
          <p className="text-[12px] text-ink-faint italic">Powered by suedue</p>
        </div>
      </div>
    );
  }

  // ===================== EXPIRED / CANCELLED =====================
  if (status === "EXPIRED" || status === "CANCELLED") {
    return (
      <div className="w-full max-w-[400px] bg-canvas-soft border border-hairline rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500 mx-auto">
        <div className="p-xl text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 border border-gray-200 rounded-full flex items-center justify-center shadow-sm mb-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500 opacity-5"></div>
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-semibold text-ink mb-sm tracking-tight">Not Available</h1>
          <p className="text-sm text-ink-mute mb-xl leading-relaxed">
            This payment request has expired or has been cancelled.
          </p>
          <div className="w-full bg-canvas border border-hairline rounded-xl p-md flex flex-col items-center gap-sm">
            <span className="text-[10px] uppercase tracking-widest text-ink-mute font-bold">Request Status</span>
            <span className="text-xs font-mono font-bold text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">{status}</span>
          </div>
        </div>
        <div className="bg-canvas border-t border-hairline p-md text-center">
          <p className="text-[11px] text-ink-faint uppercase tracking-widest font-semibold italic">Powered by suedue</p>
        </div>
      </div>
    );
  }

  // ===================== ACTIVE PAYMENT =====================
  // Clean token with NO SPACES (e.g. "SD7A8B") for 100% UPI compatibility across all banking apps
  const cleanToken = (refCode || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const upiUrl = `upi://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || "test@ybl"}&pn=suedue&am=${amountPaise / 100}&cu=INR${cleanToken ? `&tn=${cleanToken}` : ""}`;
  const mins = Math.floor(timeLeft / 60);
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="w-full max-w-[448px] bg-canvas-soft border border-hairline rounded-xl shadow-lg p-xl md:p-xxl text-center">
      <div className="mb-xl">
        <p className="text-ink-mute micro uppercase tracking-wider mb-xs">Payment Request</p>
        <h1 className="display-md text-ink">{billTitle}</h1>
      </div>

      <div className="mb-xl py-lg border-y border-hairline">
        <p className="text-ink-mute body-md mb-xs">Amount Due</p>
        <p className="display-xl text-primary">{formatMoney(amountPaise)}</p>
      </div>

      <p className="body-md text-ink-mute mb-xl">
        Hi {personName}, please complete your payment for the above bill. Once paid, your payment will be automatically verified.
      </p>

      {!showUtrForm ? (
        <div className="bg-primary text-on-primary p-lg rounded-lg mb-lg flex flex-col items-center">
          <p className="body-strong mb-md">Pay using UPI</p>
          <div className="bg-white p-sm rounded-md mb-md w-48 h-48 flex items-center justify-center text-ink-mute border-4 border-white overflow-hidden relative">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`}
              alt="UPI QR Code"
              className="w-full h-full object-cover"
            />
          </div>
          <a
            href={upiUrl}
            className="bg-white text-primary px-lg py-sm rounded-full font-bold mb-md hover:bg-gray-100 transition shadow-sm"
          >
            Pay with UPI App
          </a>
          <p className="micro opacity-80 text-center mb-xs">Scan or click to open any UPI app</p>
          
          {cleanToken && (
            <div className="inline-flex items-center gap-1 bg-white/10 px-sm py-0.5 rounded text-[11px] font-mono tracking-wider mb-sm opacity-90">
              <span>Note:</span> <span className="font-bold">{cleanToken}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-1.5 mt-sm text-xs opacity-70">
            {timeLeft > 0 ? (
              <>
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>Verifying · {mins}:{secs}</span>
              </>
            ) : (
              <span className="text-yellow-200">Verification timed out</span>
            )}
          </div>

          <button
            onClick={() => { setShowUtrForm(true); setUtrSubmitted(false); }}
            className="mt-md text-xs text-white/80 underline hover:text-white transition text-center"
          >
            Paid via an app without notes? Verify with UTR number →
          </button>
        </div>
      ) : (
        <div className="bg-canvas border border-hairline p-lg rounded-lg mb-lg text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
          {utrSubmitted ? (
            <div className="text-center py-md space-y-sm">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="body-strong text-ink">Verifying with UTR...</p>
              <div className="bg-canvas-soft border border-hairline px-md py-xs rounded-md inline-block">
                <span className="text-xs font-mono font-bold text-ink">UTR: {utr}</span>
                <span className="text-xs text-ink-mute ml-2">({formatMoney(amountPaise)})</span>
              </div>
              <p className="text-xs text-ink-mute mt-xs leading-relaxed">
                Checking your 12-digit UTR against FamPay receipts. This page will update automatically the moment it is confirmed.
              </p>
              <div className="pt-sm">
                <button
                  type="button"
                  onClick={() => { setShowUtrForm(false); setUtrSubmitted(false); }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  ← Back to QR Code
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submitUtr}>
              <div className="flex items-center justify-between mb-md">
                <div>
                  <p className="body-strong text-ink">Verify with UTR</p>
                  <p className="text-xs text-ink-mute mt-0.5">
                    For bank apps that strip or don't allow transaction notes
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUtrForm(false)}
                  className="text-primary text-xs hover:underline ml-sm whitespace-nowrap"
                >
                  Back to QR
                </button>
              </div>

              {utrError && (
                <div className="mb-sm text-xs text-red-600 bg-red-50 border border-red-100 p-sm rounded">
                  {utrError}
                </div>
              )}

              <input
                type="text"
                placeholder="Enter 12-digit UTR / Ref number"
                className="w-full bg-canvas-soft border border-hairline rounded-md px-md py-sm mb-md focus:outline-none focus:border-primary font-mono text-sm tracking-wider"
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))}
                maxLength={12}
                pattern="\d{12}"
                required
                disabled={isVerifyingUtr}
              />
              <Button 
                type="submit" 
                className="w-full btn-primary-dark"
                disabled={isVerifyingUtr || utr.length !== 12}
              >
                {isVerifyingUtr ? "Verifying UTR & Amount..." : "Verify Payment Now"}
              </Button>
            </form>
          )}
        </div>
      )}

      <p className="micro text-ink-faint mt-md italic">Powered by suedue</p>
    </div>
  );
}
