"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertCircle, Copy, Check, Smartphone, X, Info } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

export default function LivePaymentUI({ token, refCode, billTitle, personName, amountPaise, initialStatus, initialUtr, initialDate, upiId }: any) {
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
  const [showModal, setShowModal] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [isWhatsAppBrowser, setIsWhatsAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsWhatsAppBrowser(/WhatsApp/i.test(navigator.userAgent));
    }
  }, []);

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
      await fetch(`/api/pay/${token}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utr: cleanUtr }),
      });

      await fetch("/api/payments/verify", { method: "POST" }).catch(() => {});

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
      <div className="w-full max-w-[448px] bg-canvas-soft border border-hairline rounded-2xl shadow-xl p-xl md:p-xxl animate-in zoom-in-95 duration-500 mx-auto text-center">
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
        <div className="bg-canvas border border-hairline rounded-xl overflow-hidden shadow-sm text-left">
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
      <div className="w-full max-w-[400px] bg-canvas-soft border border-hairline rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500 mx-auto text-center">
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
  const activeUpiId = upiId || process.env.NEXT_PUBLIC_UPI_ID || "yashrajchouhan@fam";
  const cleanToken = (refCode || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const amountRupees = (amountPaise / 100).toFixed(2);

  const upiQuery = `pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent("suedue")}&am=${amountRupees}&cu=INR${cleanToken ? `&tn=${encodeURIComponent(cleanToken)}` : ""}`;

  const upiUrls = {
    generic: `upi://pay?${upiQuery}`,
    intent: `intent://pay?${upiQuery}#Intent;scheme=upi;end`,
    gpay: `tez://upi/pay?${upiQuery}`,
    phonepe: `phonepe://pay?${upiQuery}`,
    paytm: `paytmmp://pay?${upiQuery}`,
    cred: `credpay://upi/pay?${upiQuery}`,
  };

  const handleOpenGenericChooser = () => {
    const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = upiUrls.intent;
    } else {
      window.location.href = upiUrls.generic;
    }
  };

  const handleCopyUpi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(activeUpiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleCopyNote = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard && cleanToken) {
      navigator.clipboard.writeText(cleanToken);
      setCopiedNote(true);
      setTimeout(() => setCopiedNote(false), 2000);
    }
  };

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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrls.generic)}`}
                alt="UPI QR Code"
                className="w-full h-full object-cover"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="bg-white text-primary px-lg py-sm rounded-full font-bold mb-md hover:bg-gray-100 active:scale-95 transition shadow-sm cursor-pointer"
            >
              Pay with UPI App
            </button>

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
              type="button"
              onClick={() => { setShowUtrForm(true); setUtrSubmitted(false); }}
              className="mt-md text-xs text-white/80 underline hover:text-white transition text-center cursor-pointer"
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

      {/* ===================== CHOOSE UPI APP POPUP MODAL ===================== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-canvas border border-hairline rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-left animate-in slide-in-from-bottom-6 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div>
                <h3 className="font-bold text-ink text-base">Pay with UPI</h3>
                <p className="text-xs text-ink-mute mt-0.5">Choose your UPI app to complete payment</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-ink-mute hover:text-ink rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MANDATORY INSTRUCTIONS BOX */}
            <div className="bg-canvas-soft border border-hairline rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-ink font-bold text-xs">
                <Info className="w-4 h-4 text-ink shrink-0" />
                <span>Important Payment Instructions</span>
              </div>
              
              <ul className="text-xs text-ink-mute space-y-1.5 pl-1">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-ink">•</span>
                  <span>
                    Confirm Amount: <strong className="text-ink font-mono font-bold">₹{amountRupees}</strong>
                  </span>
                </li>
                {cleanToken && (
                  <li className="flex items-start gap-1.5">
                    <span className="font-bold text-ink">•</span>
                    <span>
                      Add Remarks / Note: <strong className="text-ink font-mono font-bold">{cleanToken}</strong> (Required for instant auto-verification)
                    </span>
                  </li>
                )}
              </ul>

              {/* Quick Copy Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {cleanToken && (
                  <button
                    type="button"
                    onClick={handleCopyNote}
                    className="flex items-center justify-between gap-1.5 py-1.5 px-2.5 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft active:scale-95 text-xs font-medium transition"
                  >
                    <span className="text-[11px] text-ink-mute">Note: <strong className="font-mono text-ink">{cleanToken}</strong></span>
                    {copiedNote ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5"><Check className="w-3 h-3" /> Copied</span>
                    ) : (
                      <span className="text-[11px] font-bold text-ink flex items-center gap-0.5"><Copy className="w-3 h-3 text-ink-mute" /> Copy</span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center justify-between gap-1.5 py-1.5 px-2.5 rounded-lg border border-hairline bg-canvas hover:bg-canvas-soft active:scale-95 text-xs font-medium transition"
                >
                  <span className="text-[11px] text-ink-mute truncate">UPI: <strong className="font-mono text-ink truncate">{activeUpiId}</strong></span>
                  {copiedUpi ? (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 shrink-0"><Check className="w-3 h-3" /> Copied</span>
                  ) : (
                    <span className="text-[11px] font-bold text-ink flex items-center gap-0.5 shrink-0"><Copy className="w-3 h-3 text-ink-mute" /> Copy</span>
                  )}
                </button>
              </div>
            </div>

            {/* WhatsApp Webview Tip */}
            {isWhatsAppBrowser && (
              <div className="bg-canvas-soft border border-hairline rounded-xl p-2.5 text-[11px] text-ink-mute flex items-start gap-2">
                <span className="text-sm shrink-0">💡</span>
                <p>
                  <strong>Tip:</strong> If your UPI app doesn&apos;t launch from WhatsApp, tap the <strong>3 dots (⋮)</strong> at top right and choose <strong>&ldquo;Open in Chrome / Browser&rdquo;</strong>.
                </p>
              </div>
            )}

            {/* UPI App Selection */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-ink uppercase tracking-wider block">
                Select UPI App
              </span>

              <div className="grid grid-cols-2 gap-2">
                {/* Google Pay */}
                <a
                  href={upiUrls.gpay}
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20"
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center bg-white border border-gray-200 font-black text-blue-600 text-[11px] shadow-2xs">
                    G
                  </span>
                  <span>Google Pay</span>
                </a>

                {/* PhonePe */}
                <a
                  href={upiUrls.phonepe}
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20"
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center bg-[#5f259f] text-white font-bold text-[10px] shadow-2xs">
                    Pe
                  </span>
                  <span>PhonePe</span>
                </a>

                {/* Paytm */}
                <a
                  href={upiUrls.paytm}
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20"
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center bg-[#00b9f5] text-white font-black text-[8px] shadow-2xs">
                    Pay
                  </span>
                  <span>Paytm</span>
                </a>

                {/* CRED */}
                <a
                  href={upiUrls.cred}
                  onClick={() => setShowModal(false)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20"
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center bg-black text-white font-black text-[9px] shadow-2xs">
                    CR
                  </span>
                  <span>CRED</span>
                </a>
              </div>

              {/* All Other UPI Apps (Android Native Package Intent / iOS System Chooser) */}
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  handleOpenGenericChooser();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-ink text-canvas hover:bg-ink/90 active:scale-[0.98] rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Other UPI Apps (BHIM, Navi, etc.)</span>
              </button>
            </div>

            {/* NOT USING UPI APP / MANUAL NETBANKING */}
            <div className="pt-2 border-t border-hairline space-y-1.5">
              <span className="text-[11px] font-bold text-ink-mute uppercase tracking-wider block">
                Not using a direct UPI app?
              </span>
              <p className="text-xs text-ink-mute leading-relaxed">
                You can manually transfer <strong className="text-ink">₹{amountRupees}</strong> to UPI ID <strong className="font-mono text-ink">{activeUpiId}</strong> with note <strong className="font-mono text-ink">{cleanToken}</strong> using any NetBanking or banking app.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setShowUtrForm(true);
                  setUtrSubmitted(false);
                }}
                className="text-xs text-ink underline hover:text-ink/80 font-semibold cursor-pointer pt-0.5 inline-block"
              >
                Paid without note? Verify with 12-digit UTR number →
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
