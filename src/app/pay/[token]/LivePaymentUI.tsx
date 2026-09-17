"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Smartphone, 
  X, 
  Info, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  Banknote
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

interface UPIAppConfig {
  id: string;
  name: string;
  shortLabel: string;
  bg: string;
  color: string;
  pkg?: string;
  scheme?: string;
}

const POPULAR_UPI_APPS: UPIAppConfig[] = [
  { id: "gpay", name: "Google Pay", shortLabel: "G", bg: "bg-white text-blue-600 border border-gray-200", color: "text-blue-600", pkg: "com.google.android.apps.nbu.paisa.user", scheme: "tez://upi/pay" },
  { id: "phonepe", name: "PhonePe", shortLabel: "Pe", bg: "bg-[#5f259f] text-white", color: "text-white", pkg: "com.phonepe.app", scheme: "phonepe://pay" },
  { id: "paytm", name: "Paytm", shortLabel: "Pay", bg: "bg-[#00b9f5] text-white", color: "text-white", pkg: "net.one97.paytm", scheme: "paytmmp://pay" },
  { id: "cred", name: "CRED", shortLabel: "CR", bg: "bg-black text-white", color: "text-white", pkg: "com.dreamplug.androidapp", scheme: "credpay://upi/pay" },
  { id: "bhim", name: "BHIM (NPCI)", shortLabel: "BH", bg: "bg-[#003b73] text-white", color: "text-white", pkg: "in.org.npci.upiapp", scheme: "upi://pay" },
  { id: "amazonpay", name: "Amazon Pay", shortLabel: "AP", bg: "bg-[#ff9900] text-black", color: "text-black", pkg: "in.amazon.mShop.android.shopping", scheme: "amazonpay://upi/pay" },
  { id: "navi", name: "Navi UPI", shortLabel: "NV", bg: "bg-[#00d09c] text-black", color: "text-black", pkg: "com.naviapp", scheme: "navi://upi/pay" },
  { id: "tataneu", name: "Tata Neu", shortLabel: "TN", bg: "bg-[#482880] text-white", color: "text-white", pkg: "com.tatadigital.tcp", scheme: "tataneu://upi/pay" },
  { id: "whatsapp", name: "WhatsApp Pay", shortLabel: "WA", bg: "bg-[#25d366] text-white", color: "text-white", pkg: "com.whatsapp", scheme: "whatsapp://pay" },
  { id: "jupiter", name: "Jupiter Money", shortLabel: "JP", bg: "bg-[#f37254] text-white", color: "text-white", pkg: "money.jupiter", scheme: "jupiter://upi/pay" },
  { id: "fi", name: "Fi Money", shortLabel: "Fi", bg: "bg-[#00c9a7] text-black", color: "text-black", pkg: "money.fi.banking", scheme: "fi://upi/pay" },
  { id: "slice", name: "Slice", shortLabel: "SL", bg: "bg-[#8a2be2] text-white", color: "text-white", pkg: "org.slice.app", scheme: "slice://upi/pay" },
  { id: "mobikwik", name: "MobiKwik", shortLabel: "MK", bg: "bg-[#1877f2] text-white", color: "text-white", pkg: "com.mobikwik_new", scheme: "mobikwik://upi/pay" },
  { id: "freecharge", name: "Freecharge", shortLabel: "FC", bg: "bg-[#f58220] text-white", color: "text-white", pkg: "com.freecharge.android", scheme: "freecharge://upi/pay" },
  { id: "payzapp", name: "PayZapp (HDFC)", shortLabel: "PZ", bg: "bg-[#004c8f] text-white", color: "text-white", pkg: "com.enStage.wibmo.hdfc", scheme: "payzapp://upi/pay" },
  { id: "imobile", name: "iMobile Pay (ICICI)", shortLabel: "IC", bg: "bg-[#bd362f] text-white", color: "text-white", pkg: "com.csam.icici.bank.imobile", scheme: "imobile://upi/pay" },
  { id: "yono", name: "YONO SBI", shortLabel: "SBI", bg: "bg-[#280071] text-white", color: "text-white", pkg: "com.sbi.lotusintouch", scheme: "yono://upi/pay" },
  { id: "kotak", name: "Kotak 811", shortLabel: "811", bg: "bg-[#ed1c24] text-white", color: "text-white", pkg: "com.msf.kbank.mobile", scheme: "kotak://upi/pay" },
  { id: "axis", name: "Axis Mobile", shortLabel: "AX", bg: "bg-[#97144d] text-white", color: "text-white", pkg: "com.axis.mobile", scheme: "axis://upi/pay" },
  { id: "bob", name: "bob World (Bank of Baroda)", shortLabel: "BOB", bg: "bg-[#f26522] text-white", color: "text-white", pkg: "com.bankofbaroda.mconnect", scheme: "bobworld://upi/pay" },
  { id: "pnb", name: "PNB ONE", shortLabel: "PNB", bg: "bg-[#a20a3a] text-white", color: "text-white", pkg: "com.pnb.pnbone", scheme: "pnbone://upi/pay" },
  { id: "canara", name: "Canara ai1", shortLabel: "CN", bg: "bg-[#0089cf] text-white", color: "text-white", pkg: "com.canarabank.mobility", scheme: "canaraai1://upi/pay" },
  { id: "federal", name: "FedMobile (Federal Bank)", shortLabel: "FED", bg: "bg-[#0f2e5c] text-white", color: "text-white", pkg: "com.fedmobile", scheme: "fedmobile://upi/pay" },
  { id: "bajaj", name: "Bajaj Finserv", shortLabel: "BJ", bg: "bg-[#0072bc] text-white", color: "text-white", pkg: "org.altruist.BajajExperia", scheme: "bajajfinserv://upi/pay" },
  { id: "samsung", name: "Samsung Pay", shortLabel: "SP", bg: "bg-[#1428a0] text-white", color: "text-white", pkg: "com.samsung.android.spay", scheme: "samsungpay://upi/pay" },
];

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
  const [modalView, setModalView] = useState<"main" | "other_apps" | "manual">("main");
  const [appSearch, setAppSearch] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
  const genericUpiUrl = `upi://pay?${upiQuery}`;

  const triggerAppLaunch = (app: UPIAppConfig) => {
    // 1. Automatically copy note to clipboard so user can paste in remarks
    if (cleanToken && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cleanToken).catch(() => {});
      setToastMessage(`Note "${cleanToken}" copied!`);
      setTimeout(() => setToastMessage(null), 2500);
    }

    const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
    
    if (isAndroid && app.pkg) {
      // Direct native package intent launch
      const intentUrl = `intent://pay?${upiQuery}#Intent;scheme=upi;package=${app.pkg};end`;
      window.location.href = intentUrl;
    } else if (app.scheme) {
      // Direct custom scheme (iOS / fallback)
      const schemeUrl = `${app.scheme}?${upiQuery}`;
      window.location.href = schemeUrl;
    } else {
      // Generic UPI intent
      window.location.href = genericUpiUrl;
    }
  };

  const handleOpenSystemChooser = () => {
    if (cleanToken && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cleanToken).catch(() => {});
      setToastMessage(`Note "${cleanToken}" copied!`);
      setTimeout(() => setToastMessage(null), 2500);
    }

    const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = `intent://pay?${upiQuery}#Intent;scheme=upi;action=android.intent.action.VIEW;end;`;
    } else {
      window.location.href = genericUpiUrl;
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

  const filteredApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    if (!q) return POPULAR_UPI_APPS;
    return POPULAR_UPI_APPS.filter(a => 
      a.name.toLowerCase().includes(q) || 
      a.shortLabel.toLowerCase().includes(q)
    );
  }, [appSearch]);

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
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(genericUpiUrl)}`}
                alt="UPI QR Code"
                className="w-full h-full object-cover"
              />
            </div>
            
            <button
              type="button"
              onClick={() => {
                setModalView("main");
                setAppSearch("");
                setShowModal(true);
              }}
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
          <div className="bg-canvas border border-hairline rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-left animate-in slide-in-from-bottom-6 duration-200 relative">
            
            {/* Toast Notification when copied */}
            {toastMessage && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-ink text-canvas text-xs font-bold py-1.5 px-4 rounded-full shadow-lg z-20 animate-in fade-in duration-150">
                {toastMessage}
              </div>
            )}

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                {modalView !== "main" && (
                  <button
                    type="button"
                    onClick={() => setModalView("main")}
                    className="p-1 -ml-1 text-ink-mute hover:text-ink rounded-lg transition"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-ink text-base">
                    {modalView === "main" && "Pay with UPI"}
                    {modalView === "other_apps" && "All UPI Apps"}
                    {modalView === "manual" && "Copy Details & Note"}
                  </h3>
                  <p className="text-xs text-ink-mute mt-0.5">
                    {modalView === "main" && "Choose your preferred app"}
                    {modalView === "other_apps" && "Search 25+ mapped UPI apps"}
                    {modalView === "manual" && "For NetBanking, IMPS, or other banks"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-ink-mute hover:text-ink rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MANDATORY INSTRUCTIONS BANNER (Required for Instant Auto-Verification) */}
            <div className="bg-canvas-soft border border-hairline rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-ink font-bold text-xs">
                <Info className="w-4 h-4 text-ink shrink-0" />
                <span>Instant Auto-Verification Rule</span>
              </div>
              <p className="text-xs text-ink-mute leading-relaxed">
                Ensure amount is set to <strong className="text-ink font-mono font-bold">₹{amountRupees}</strong> and paste Note <strong className="text-ink font-mono font-bold">{cleanToken}</strong> in your app&apos;s remarks field.
              </p>
            </div>

            {/* VIEW 1: MAIN MINIMAL VIEW */}
            {modalView === "main" && (
              <div className="space-y-3.5">
                {/* 4 Primary Top Apps */}
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_UPI_APPS.slice(0, 4).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => triggerAppLaunch(app)}
                      className="flex items-center justify-center gap-2.5 py-3 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20 cursor-pointer"
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] shadow-2xs ${app.bg}`}>
                        {app.shortLabel}
                      </span>
                      <span>{app.name}</span>
                    </button>
                  ))}
                </div>

                {/* Other UPI Apps Button -> Expands Search Directory */}
                <button
                  type="button"
                  onClick={() => setModalView("other_apps")}
                  className="w-full flex items-center justify-between py-2.5 px-4 bg-canvas-soft hover:bg-canvas active:scale-[0.98] border border-hairline rounded-xl text-xs font-bold text-ink transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-ink-mute" />
                    <span>Other UPI Apps (BHIM, Navi, Tata Neu, Banks...)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-mute" />
                </button>

                {/* System Native Intent Chooser (Android OS Sheet) */}
                <button
                  type="button"
                  onClick={handleOpenSystemChooser}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-ink text-canvas hover:bg-ink/90 active:scale-[0.98] rounded-xl font-bold text-xs transition shadow-sm cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open via Phone System Chooser</span>
                </button>

                {/* Manual Transfer / Copy Note Action */}
                <div className="pt-2 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setModalView("manual")}
                    className="w-full text-center text-xs font-semibold text-ink-mute hover:text-ink underline transition py-1 cursor-pointer"
                  >
                    Not using a direct app? Copy details & message note →
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2: SEARCHABLE LIST OF ALL 25+ MAPPED UPI APPS */}
            {modalView === "other_apps" && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search UPI apps (e.g. BHIM, Navi, HDFC...)"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    autoFocus
                    className="w-full bg-canvas text-ink border border-hairline rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-ink transition font-medium"
                  />
                  {appSearch && (
                    <button
                      type="button"
                      onClick={() => setAppSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Apps Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-[46vh] overflow-y-auto pr-0.5">
                  {filteredApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => triggerAppLaunch(app)}
                      className="flex items-center gap-2.5 py-2.5 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20 text-left cursor-pointer"
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[9px] shrink-0 shadow-2xs ${app.bg}`}>
                        {app.shortLabel}
                      </span>
                      <span className="truncate">{app.name}</span>
                    </button>
                  ))}

                  {filteredApps.length === 0 && (
                    <div className="col-span-2 py-6 text-center text-xs text-ink-mute">
                      No matching app found. Tap below to launch your phone&apos;s default picker.
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-hairline flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleOpenSystemChooser}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-ink text-canvas rounded-xl text-xs font-bold transition active:scale-[0.98] cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Open Native App Chooser</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalView("manual")}
                    className="text-center text-xs text-ink-mute hover:text-ink underline py-1 transition cursor-pointer"
                  >
                    Can&apos;t find your app? Copy details manually →
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 3: COPY MESSAGE / MANUAL TRANSFER FOR INSTANT VERIFICATION */}
            {modalView === "manual" && (
              <div className="space-y-3.5">
                <div className="bg-canvas-soft border border-hairline rounded-xl p-3 text-xs text-ink leading-relaxed">
                  Transfer from any NetBanking or banking app using the details below. <strong className="font-bold">Be sure to paste the Note in remarks</strong> for instant verification!
                </div>

                {/* Copy Card: Note / Token */}
                <div className="bg-canvas border border-hairline rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-ink-mute tracking-wider block">
                      Message / Note (Required)
                    </span>
                    <span className="font-mono font-bold text-sm text-ink">{cleanToken}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyNote}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-hairline bg-canvas-soft hover:bg-canvas active:scale-95 transition shrink-0 cursor-pointer"
                  >
                    {copiedNote ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-ink-mute" />
                        <span>Copy Note</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Copy Card: UPI ID */}
                <div className="bg-canvas border border-hairline rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-ink-mute tracking-wider block">
                      Receiving UPI ID
                    </span>
                    <span className="font-mono font-bold text-sm text-ink truncate block">{activeUpiId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border border-hairline bg-canvas-soft hover:bg-canvas active:scale-95 transition shrink-0 cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-ink-mute" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Copy Card: Amount */}
                <div className="bg-canvas border border-hairline rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-ink-mute tracking-wider block">
                      Amount
                    </span>
                    <span className="font-mono font-bold text-sm text-ink">₹{amountRupees}</span>
                  </div>
                  <span className="text-xs text-ink-mute font-semibold">Exact Amount</span>
                </div>

                {/* UTR Fallback Button */}
                <div className="pt-2 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setShowUtrForm(true);
                      setUtrSubmitted(false);
                    }}
                    className="w-full py-2 px-3 text-center text-xs font-bold text-ink underline hover:text-ink/80 transition cursor-pointer"
                  >
                    Paid without remarks? Verify with 12-digit UTR number →
                  </button>
                </div>
              </div>
            )}

            {/* Tip for in-app browsers like WhatsApp */}
            {isWhatsAppBrowser && (
              <div className="bg-canvas-soft border border-hairline rounded-xl p-2.5 text-[11px] text-ink-mute flex items-start gap-2">
                <span className="text-sm shrink-0">💡</span>
                <p>
                  <strong>Tip:</strong> If your UPI app doesn&apos;t launch from WhatsApp, tap the <strong>3 dots (⋮)</strong> at top right and choose <strong>&ldquo;Open in Chrome / Browser&rdquo;</strong>.
                </p>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
