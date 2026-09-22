"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Copy, Check, X, Info, Loader2 } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

export default function LivePaymentUI({ token, refCode, billTitle, personName, amountPaise, initialStatus, initialUtr, initialDate, upiId, payeeName }: any) {
  const [status, setStatus] = useState(initialStatus);
  const [timeLeft, setTimeLeft] = useState(300);
  const [utr, setUtr] = useState("");
  const [utrSubmitted, setUtrSubmitted] = useState(false);
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  const [utrError, setUtrError] = useState("");
  const [verifiedUtr, setVerifiedUtr] = useState<string | null>(initialUtr || null);
  const [paymentDate, setPaymentDate] = useState<string | null>(null);

  useEffect(() => {
    if (initialDate) {
      try {
        const d = new Date(initialDate);
        if (!isNaN(d.getTime())) {
          setPaymentDate(
            d.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          );
        }
      } catch {}
    }
  }, [initialDate]);

  const [showUtrForm, setShowUtrForm] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);

  const isDone = status === "PAID" || status === "COMPLETED" || status === "CANCELLED";

  const triggerVerification = useCallback(async () => {
    try {
      const response = await fetch("/api/payments/verify", { method: "POST" });
      const data = response.ok ? await response.json() : null;
      if (data?.processingCount > 0) setStatus("PROCESSING");
    } catch {}
  }, []);

  // --- TIMER: ticks every 1 second ---
  useEffect(() => {
    if (isDone) return;

    const id = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) {
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
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data) return;
          if (data.status === "PAID") {
            setStatus("PAID");
            if (data.utr) setVerifiedUtr(data.utr);
            if (data.paymentTime) {
              try {
                const d = new Date(data.paymentTime);
                if (!isNaN(d.getTime())) {
                  setPaymentDate(
                    d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  );
                }
              } catch {}
            }
          } else if (data.status === "PROCESSING") {
            setStatus("PROCESSING");
          } else if (data.status === "ACTIVE") {
            setStatus("ACTIVE");
          }
        })
        .catch(() => {});
    }, 2500);

    return () => clearInterval(id);
  }, [isDone, token]);

  // Keep a single fallback trigger for local/dev setups where the verifier webhook cannot reach Next.js.
  useEffect(() => {
    if (isDone) return;
    const id = setInterval(() => {
      triggerVerification();
    }, 3000);
    return () => clearInterval(id);
  }, [isDone, triggerVerification]);

  // --- INITIAL VERIFY CHECK: Run once on page mount ---
  useEffect(() => {
    if (isDone) return;
    triggerVerification();
  }, [isDone, triggerVerification]);

  // --- SUBMIT UTR ---
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
      await fetch(`/api/pay/${token}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr: cleanUtr }),
      });

      await triggerVerification();

      const res = await fetch(`/api/pay/${token}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "PAID") {
          setStatus("PAID");
          if (data.utr) setVerifiedUtr(data.utr);
          if (data.paymentTime) {
            try {
              const d = new Date(data.paymentTime);
              if (!isNaN(d.getTime())) {
                setPaymentDate(
                  d.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                );
              }
            } catch {}
          }
          setIsVerifyingUtr(false);
          return;
        }
      }

      setUtrSubmitted(true);
    } catch {
      setUtrError("Error submitting UTR. Please try again.");
    } finally {
      setIsVerifyingUtr(false);
    }
  }, [token, triggerVerification, utr]);

  // ===================== PAID / COMPLETED =====================
  if (status === "PAID" || status === "COMPLETED") {
    return (
      <div className="w-full max-w-[448px] bg-canvas-soft border border-hairline rounded-2xl shadow-xl p-xl md:p-xxl animate-in zoom-in-95 duration-500 mx-auto text-center">
        <div className="flex justify-center mb-lg">
          <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-green-600 animate-in spin-in-12 duration-700" />
          </div>
        </div>
        <div className="text-center mb-xl">
          <h1 className="text-2xl font-semibold text-ink mb-xs">Payment Successful</h1>
          <p className="text-sm text-ink-mute">
            Thank you, {personName || "Friend"}. Your payment has been securely verified.
          </p>
        </div>
        <div className="bg-canvas border border-hairline rounded-xl overflow-hidden shadow-sm text-left">
          <div className="p-md border-b border-hairline flex justify-between items-center bg-gray-50/50">
            <span className="text-sm text-ink-mute">Amount Paid</span>
            <span className="text-xl font-bold text-ink">{formatMoney(amountPaise || 0)}</span>
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

  // ===================== CANCELLED =====================
  if (status === "CANCELLED") {
    return (
      <div className="w-full max-w-[448px] text-center my-auto py-xl">
        <h1 className="text-2xl font-bold text-ink mb-sm tracking-tight">INVALID LINK</h1>
        <p className="text-sm text-ink-mute">This payment link is invalid or has been cancelled.</p>
      </div>
    );
  }

  if (status === "PROCESSING") {
    return (
      <div className="w-full max-w-[448px] bg-canvas-soft border border-hairline rounded-2xl shadow-xl p-xl md:p-xxl text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto mb-lg flex h-16 w-16 items-center justify-center rounded-full bg-primary/5 border border-primary/10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
        <p className="micro uppercase tracking-wider text-ink-mute mb-xs">Payment detected</p>
        <h1 className="text-2xl font-black tracking-tight text-ink">Confirming your payment</h1>
        <p className="mt-sm text-sm leading-relaxed text-ink-mute">
          We found a matching payment email and are checking its transaction details. This usually takes a few seconds.
        </p>
        <div className="mt-lg rounded-xl border border-hairline bg-canvas px-md py-sm text-left">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-ink-mute">Amount</span>
            <span className="font-bold text-ink">{formatMoney(amountPaise)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className="text-ink-mute">Status</span>
            <span className="font-semibold text-primary">Verifying securely…</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setStatus("ACTIVE"); setShowUtrForm(true); }}
          className="mt-lg text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary-deep"
        >
          Paid via an app without a note? Enter your UTR instead
        </button>
      </div>
    );
  }

  // ===================== ACTIVE PAYMENT =====================
  const activeUpiId = upiId || process.env.NEXT_PUBLIC_UPI_ID || "yashrajchouhan@fam";
  const activePayeeName = (payeeName && payeeName !== "Admin") ? payeeName : "Yashraj Chouhan";
  const cleanToken = (refCode || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const amountRupees = (amountPaise / 100).toFixed(2);

  const directUpiLink = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activePayeeName)}&am=${amountRupees}&cu=INR${cleanToken ? `&tn=${encodeURIComponent(cleanToken)}` : ""}`;

  const copyValue = (value: string, setCopied: (value: boolean) => void) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const handleCopyUpi = () => copyValue(activeUpiId, setCopiedUpi);

  const handleCopyNote = () => cleanToken && copyValue(cleanToken, setCopiedNote);

  const mins = Math.floor(timeLeft / 60);
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <>
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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(directUpiLink)}`}
                alt="UPI QR Code"
                className="w-full h-full object-cover"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowInstructionModal(true)}
              className="bg-white text-primary px-lg py-sm rounded-full font-bold mb-md hover:bg-gray-100 active:scale-95 transition shadow-sm cursor-pointer"
            >
              Payment instructions
            </button>

            <p className="micro opacity-80 text-center mb-xs">Scan or click to open any UPI / Bank app</p>
            
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
                <span className="flex items-center gap-1.5 text-yellow-200">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></span>
                  <span>Checking for payment...</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setShowUtrForm(true); setUtrSubmitted(false); }}
              className="mt-md text-xs text-white/80 underline hover:text-white transition text-center cursor-pointer"
            >
              <span className="text-[11px]">Paid via an app without notes? Verify with UTR number →</span>
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
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
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
                      For bank apps that strip or don&apos;t allow transaction notes
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUtrForm(false)}
                    className="text-primary text-xs hover:underline ml-sm whitespace-nowrap cursor-pointer"
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

      {/* ===================== PAY WITH BANK / UPI APP POPUP MODAL ===================== */}
      {showInstructionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-canvas border border-hairline rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-left animate-in slide-in-from-bottom-6 duration-200 relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="font-bold text-ink text-base">Pay with Bank / UPI App</h3>
                <p className="text-xs text-ink-mute mt-0.5">Please review instructions before paying</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInstructionModal(false)}
                className="p-1 text-ink-mute hover:text-ink rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Box */}
            <div className="bg-canvas-soft border border-hairline rounded-xl p-3.5 space-y-3">
              <div className="flex items-center gap-2 text-ink font-bold text-xs">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <span>Payment Instructions</span>
              </div>

              <p className="text-xs text-ink-mute leading-relaxed">
                Ensure the exact amount is entered and paste the <strong className="text-ink">Note</strong> into your payment remarks for instant auto-verification:
              </p>

              {/* Note / Remarks */}
              <div className="flex items-center justify-between bg-canvas border border-hairline px-3 py-2 rounded-lg gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-ink-mute uppercase font-bold tracking-wider block">
                    Note / Remarks (Required)
                  </span>
                  <span className="font-mono font-bold text-sm text-ink">{cleanToken}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNote}
                  aria-label="Copy payment note"
                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-hairline bg-canvas-soft hover:bg-canvas active:scale-95 transition shrink-0 cursor-pointer shadow-2xs"
                >
                  {copiedNote ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-ink-mute" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Receiving UPI ID */}
              <div className="flex items-center justify-between bg-canvas border border-hairline px-3 py-2 rounded-lg gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] text-ink-mute uppercase font-bold tracking-wider block">
                    Receiving UPI ID
                  </span>
                  <span className="font-mono font-bold text-sm text-ink truncate block">{activeUpiId}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  aria-label="Copy UPI ID"
                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-hairline bg-canvas-soft hover:bg-canvas active:scale-95 transition shrink-0 cursor-pointer shadow-2xs"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-ink-mute" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-1 space-y-3">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-ink">
                <p className="font-bold mb-1">How to pay</p>
                <ol className="list-decimal list-inside space-y-1 text-ink-mute">
                  <li>Open any UPI or bank app and scan the QR code.</li>
                  <li>Pay the exact amount and add the note shown above.</li>
                  <li><strong className="text-ink">If anything does not work</strong>, take a <strong className="text-ink">screenshot</strong> of this QR code, <strong className="text-ink">upload it</strong> in your payment app, and pay.</li>
                </ol>
              </div>
              <a
                href={directUpiLink}
                className="w-full flex items-center justify-center py-3 px-4 bg-ink text-canvas hover:bg-ink/90 active:scale-[0.98] rounded-xl text-sm font-bold transition cursor-pointer shadow-sm text-center"
              >
                Open your UPI app
              </a>
            </div>

          </div>
        </div>
      )}

    </>
  );
}
