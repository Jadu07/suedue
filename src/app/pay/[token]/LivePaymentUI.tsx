"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Building2,
  ShieldAlert
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

interface UPIAppConfig {
  id: string;
  name: string;
  domain: string;
  pkg?: string;
  scheme?: string;
}

const POPULAR_UPI_APPS: UPIAppConfig[] = [
  // Top 4 Primary Apps
  { id: "gpay", name: "Google Pay", domain: "google.com", pkg: "com.google.android.apps.nbu.paisa.user", scheme: "tez://upi/pay" },
  { id: "phonepe", name: "PhonePe", domain: "phonepe.com", pkg: "com.phonepe.app", scheme: "phonepe://pay" },
  { id: "paytm", name: "Paytm", domain: "paytm.com", pkg: "net.one97.paytm", scheme: "paytmmp://pay" },
  { id: "cred", name: "CRED", domain: "cred.club", pkg: "com.dreamplug.androidapp", scheme: "credpay://upi/pay" },

  // Leading UPI & Fintech Apps
  { id: "bhim", name: "BHIM (NPCI)", domain: "bhimupi.org.in", pkg: "in.org.npci.upiapp", scheme: "upi://pay" },
  { id: "amazonpay", name: "Amazon Pay", domain: "amazon.in", pkg: "in.amazon.mShop.android.shopping", scheme: "amazonpay://upi/pay" },
  { id: "navi", name: "Navi UPI", domain: "navi.com", pkg: "com.naviapp", scheme: "navi://upi/pay" },
  { id: "tataneu", name: "Tata Neu", domain: "tatadigital.com", pkg: "com.tatadigital.tcp", scheme: "tataneu://upi/pay" },
  { id: "whatsapp", name: "WhatsApp Pay", domain: "whatsapp.com", pkg: "com.whatsapp", scheme: "whatsapp://pay" },
  { id: "supermoney", name: "Super.money (Flipkart)", domain: "super.money", pkg: "money.super", scheme: "supermoney://upi/pay" },
  { id: "jupiter", name: "Jupiter Money", domain: "jupiter.money", pkg: "money.jupiter", scheme: "jupiter://upi/pay" },
  { id: "fi", name: "Fi Money", domain: "fi.money", pkg: "money.fi.banking", scheme: "fi://upi/pay" },
  { id: "kiwi", name: "Kiwi UPI", domain: "gokiwi.in", pkg: "in.gokiwi.app", scheme: "kiwi://upi/pay" },
  { id: "mobikwik", name: "MobiKwik", domain: "www.mobikwik.com", pkg: "com.mobikwik_new", scheme: "mobikwik://upi/pay" },
  { id: "freecharge", name: "Freecharge", domain: "freecharge.in", pkg: "com.freecharge.android", scheme: "freecharge://upi/pay" },
  { id: "bajaj", name: "Bajaj Finserv", domain: "bajajfinserv.in", pkg: "org.altruist.BajajExperia", scheme: "bajajfinserv://upi/pay" },
  { id: "samsung", name: "Samsung Pay", domain: "samsung.com", pkg: "com.samsung.android.spay", scheme: "samsungpay://upi/pay" },
  { id: "zomato", name: "Zomato UPI", domain: "zomato.com", pkg: "com.application.zomato", scheme: "zomato://upi/pay" },
  { id: "swiggy", name: "Swiggy UPI", domain: "swiggy.com", pkg: "in.swiggy.android", scheme: "swiggy://upi/pay" },

  // Bank UPI Apps
  { id: "payzapp", name: "PayZapp (HDFC)", domain: "hdfcbank.com", pkg: "com.enStage.wibmo.hdfc", scheme: "payzapp://upi/pay" },
  { id: "imobile", name: "iMobile Pay (ICICI)", domain: "icicibank.com", pkg: "com.csam.icici.bank.imobile", scheme: "imobile://upi/pay" },
  { id: "yono", name: "YONO SBI", domain: "onlinesbi.sbi", pkg: "com.sbi.lotusintouch", scheme: "yono://upi/pay" },
  { id: "kotak", name: "Kotak 811", domain: "kotak.com", pkg: "com.msf.kbank.mobile", scheme: "kotak://upi/pay" },
  { id: "axis", name: "Axis Mobile", domain: "axisbank.com", pkg: "com.axis.mobile", scheme: "axis://upi/pay" },
  { id: "bob", name: "bob World (Bank of Baroda)", domain: "bankofbaroda.in", pkg: "com.bankofbaroda.mconnect", scheme: "bobworld://upi/pay" },
  { id: "canara", name: "Canara ai1", domain: "canarabank.com", pkg: "com.canarabank.mobility", scheme: "canaraai1://upi/pay" },
  { id: "indusind", name: "IndusInd Bank", domain: "indusind.com", pkg: "com.mgs.indusmobile", scheme: "indus://upi/pay" },
  { id: "idfc", name: "IDFC FIRST Bank", domain: "idfcfirstbank.com", pkg: "com.idfcfirstbank.optimus", scheme: "idfc://upi/pay" },
  { id: "yesbank", name: "Yes Bank", domain: "yesbank.in", pkg: "com.yesbank", scheme: "yesbank://upi/pay" },
  { id: "airtel", name: "Airtel Payments Bank", domain: "airtel.in", pkg: "com.myairtelapp", scheme: "airtel://upi/pay" },
  { id: "jiopay", name: "JioPay", domain: "jio.com", pkg: "com.jio.media.jiobeats", scheme: "jiopay://upi/pay" },
  { id: "rbl", name: "RBL MoBank", domain: "rblbank.com", pkg: "com.rblbank.mobank", scheme: "rbl://upi/pay" },
];

function AppOfficialFavicon({ app }: { app: UPIAppConfig }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-white shadow-2xs border border-hairline/60">
      <img
        src={!imgError ? `/logos/${app.id}.png` : "/logos/bhim.png"}
        alt={app.name}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export default function LivePaymentUI({ token, refCode, billTitle, personName, amountPaise, initialStatus, initialUtr, initialDate, upiId, payeeName }: any) {
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
  const [modalView, setModalView] = useState<"main" | "other_apps" | "manual" | "phonepe_notice">("main");
  const [appSearch, setAppSearch] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedNote, setCopiedNote] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWhatsAppBrowser, setIsWhatsAppBrowser] = useState(false);
  const [showDirectBankGuide, setShowDirectBankGuide] = useState(false);

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
  const activePayeeName = payeeName || process.env.NEXT_PUBLIC_PAYEE_NAME || "Yashraj Chouhan";
  const cleanToken = (refCode || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const amountRupees = (amountPaise / 100).toFixed(2);

  const directUpiLink = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activePayeeName)}&am=${amountRupees}&cu=INR${cleanToken ? `&tn=${encodeURIComponent(cleanToken)}` : ""}`;
  const upiQuery = `pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(activePayeeName)}&am=${amountRupees}&cu=INR${cleanToken ? `&tn=${encodeURIComponent(cleanToken)}&tr=${encodeURIComponent(cleanToken)}` : ""}&mode=02`;
  const genericUpiUrl = directUpiLink;

  const triggerAppLaunch = (app: UPIAppConfig) => {
    if (cleanToken && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cleanToken).catch(() => {});
      setToastMessage(`Note "${cleanToken}" copied!`);
      setTimeout(() => setToastMessage(null), 2500);
    }

    if (app.id === "phonepe") {
      window.location.href = directUpiLink;
      return;
    }

    const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
    
    if (isAndroid && app.pkg) {
      const intentUrl = `intent://pay?${upiQuery}#Intent;scheme=upi;package=${app.pkg};end`;
      window.location.href = intentUrl;
    } else if (app.scheme) {
      const schemeUrl = `${app.scheme}?${upiQuery}`;
      window.location.href = schemeUrl;
    } else {
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
      a.domain.toLowerCase().includes(q)
    );
  }, [appSearch]);

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-ink text-canvas text-xs font-bold py-2 px-4 rounded-full shadow-2xl z-50 animate-in fade-in duration-150 whitespace-nowrap">
          {toastMessage}
        </div>
      )}

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
            
            {/* Direct Active Link */}
            <a
              href={directUpiLink}
              onClick={() => {
                if (cleanToken && typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(cleanToken).catch(() => {});
                  setToastMessage(`Note "${cleanToken}" copied! Paste in remarks`);
                  setTimeout(() => setToastMessage(null), 3500);
                }
              }}
              className="w-full max-w-xs flex items-center justify-center gap-2 bg-white text-primary px-lg py-3 rounded-full font-bold text-sm hover:bg-gray-100 active:scale-95 transition shadow-md cursor-pointer mb-md text-center"
            >
              <Smartphone className="w-4 h-4" />
              <span>Pay with UPI App</span>
            </a>

            <p className="micro opacity-80 text-center mb-md">Scan QR code or click button above to open your UPI app</p>

            {/* Instruction Card for Amount & Note */}
            <div className="w-full bg-white/10 border border-white/20 rounded-xl p-3 mb-md text-left text-xs text-white space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-white/90">
                <Info className="w-3.5 h-3.5" />
                <span>Payment Instructions</span>
              </div>
              
              <div className="flex items-center justify-between bg-black/15 border border-white/10 px-2.5 py-1.5 rounded-lg">
                <span className="text-white/80 font-medium">Exact Amount:</span>
                <span className="font-mono font-bold text-sm text-white">₹{amountRupees}</span>
              </div>

              <div className="flex items-center justify-between bg-black/15 border border-white/10 px-2.5 py-1.5 rounded-lg">
                <div className="min-w-0">
                  <span className="text-white/80 font-medium block text-[11px]">Note / Remarks (Required):</span>
                  <span className="font-mono font-bold text-sm text-white">{cleanToken}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyNote}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded bg-white text-primary hover:bg-white/90 active:scale-95 transition shrink-0 cursor-pointer shadow-xs"
                >
                  {copiedNote ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Note</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-[11px] text-white/80 leading-snug pt-0.5">
                ⚠️ Ensure amount is <strong className="text-white font-mono">₹{amountRupees}</strong> and paste Note <strong className="text-white font-mono">{cleanToken}</strong> in remarks for instant automatic confirmation!
              </p>
            </div>

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

        {/* Direct Bank Account / ₹2000 Limit Helper Card */}
        <div className="bg-canvas border border-hairline rounded-xl p-3.5 mb-lg text-left shadow-2xs">
          <button
            type="button"
            onClick={() => setShowDirectBankGuide(!showDirectBankGuide)}
            className="w-full flex items-center justify-between text-xs font-bold text-ink cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Bank Account blocked or ₹2,000 limit?</span>
            </span>
            <span className="text-[11px] text-primary underline">
              {showDirectBankGuide ? "Hide" : "Pay via Bank →"}
            </span>
          </button>

          {showDirectBankGuide && (
            <div className="mt-2.5 pt-2.5 border-t border-hairline text-xs text-ink-mute space-y-2 animate-in fade-in duration-150">
              <p className="leading-relaxed">
                UPI apps (like PhonePe) restrict web links to Wallets or cap them at ₹2,000.
                To pay directly from your <strong>Bank Account with no limits or warnings</strong>:
              </p>
              <div className="bg-canvas-soft border border-hairline rounded-lg p-2.5 space-y-2">
                <p className="font-semibold text-ink text-[11px]">1. Open PhonePe, GPay, or Paytm</p>
                <p className="font-semibold text-ink text-[11px]">2. Tap &ldquo;To UPI ID&rdquo; & enter:</p>
                <div className="flex items-center justify-between bg-canvas border border-hairline px-2.5 py-1.5 rounded text-ink font-mono font-bold text-xs">
                  <span>{activeUpiId}</span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="ml-2 text-[10px] font-sans font-bold px-2 py-0.5 bg-canvas-soft border border-hairline rounded hover:bg-canvas text-ink cursor-pointer"
                  >
                    {copiedUpi ? "✓ Copied" : "Copy"}
                  </button>
                </div>
                <p className="font-semibold text-ink text-[11px]">3. Add Note / Remarks for instant auto-verification:</p>
                <div className="flex items-center justify-between bg-canvas border border-hairline px-2.5 py-1.5 rounded text-ink font-mono font-bold text-xs">
                  <span>{cleanToken}</span>
                  <button
                    type="button"
                    onClick={handleCopyNote}
                    className="ml-2 text-[10px] font-sans font-bold px-2 py-0.5 bg-canvas-soft border border-hairline rounded hover:bg-canvas text-ink cursor-pointer"
                  >
                    {copiedNote ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium">
                ✓ Regular bank UPI limits (up to ₹1,00,000) and all linked bank accounts work this way without warnings.
              </p>
            </div>
          )}
        </div>

        <p className="micro text-ink-faint mt-md italic">Powered by suedue</p>
      </div>

      {/* ===================== CHOOSE UPI APP POPUP MODAL (CURRENTLY HIDDEN) ===================== */}
      {false && showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-canvas border border-hairline rounded-t-2xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-left animate-in slide-in-from-bottom-6 duration-200 relative">
            
            {/* Toast Notification when note is copied */}
            {toastMessage && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-ink text-canvas text-xs font-bold py-1.5 px-4 rounded-full shadow-lg z-20 animate-in fade-in duration-150 whitespace-nowrap">
                {toastMessage}
              </div>
            )}

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <div className="flex items-center gap-2">
                {modalView !== "main" && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalView("main");
                      setAppSearch("");
                    }}
                    className="p-1.5 -ml-1.5 text-ink-mute hover:text-ink rounded-lg transition active:scale-95 cursor-pointer"
                    aria-label="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-ink text-base">
                    {modalView === "main" && "Pay with UPI"}
                    {modalView === "other_apps" && "Select UPI App"}
                    {modalView === "manual" && "Pay via Bank (To UPI ID)"}
                    {modalView === "phonepe_notice" && "PhonePe Payment Notice"}
                  </h3>
                  <p className="text-xs text-ink-mute mt-0.5">
                    {modalView === "main" && "Select your preferred app"}
                    {modalView === "other_apps" && "Search 30+ official UPI apps"}
                    {modalView === "manual" && "Bypass ₹2,000 limit & wallet restrictions"}
                    {modalView === "phonepe_notice" && "Bypass PhonePe's ₹2,000 link restriction"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-ink-mute hover:text-ink rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MANDATORY INSTRUCTIONS BANNER */}
            <div className="bg-canvas-soft border border-hairline rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-ink font-bold text-xs">
                <Info className="w-3.5 h-3.5 text-ink shrink-0" />
                <span>Instant Auto-Verification Instruction</span>
              </div>
              <p className="text-xs text-ink-mute leading-relaxed">
                Ensure amount is <strong className="text-ink font-mono font-bold">₹{amountRupees}</strong> and add Note <strong className="text-ink font-mono font-bold">{cleanToken}</strong> into your payment remarks.
              </p>
            </div>

            {/* ================= VIEW 1: MAIN MINIMAL VIEW ================= */}
            {modalView === "main" && (
              <div className="space-y-3.5">
                {/* 4 Primary Top Apps with Real Official Logos */}
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_UPI_APPS.slice(0, 4).map((app) => (
                    app.id === "phonepe" ? (
                      <a
                        key={app.id}
                        href={directUpiLink}
                        onClick={() => {
                          if (cleanToken && typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(cleanToken).catch(() => {});
                            setToastMessage(`Note "${cleanToken}" copied!`);
                            setTimeout(() => setToastMessage(null), 2500);
                          }
                        }}
                        className="flex items-center gap-2.5 py-3 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20 cursor-pointer text-left"
                      >
                        <AppOfficialFavicon app={app} />
                        <span className="truncate">{app.name}</span>
                      </a>
                    ) : (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => triggerAppLaunch(app)}
                        className="flex items-center gap-2.5 py-3 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20 cursor-pointer text-left"
                      >
                        <AppOfficialFavicon app={app} />
                        <span className="truncate">{app.name}</span>
                      </button>
                    )
                  ))}
                </div>

                {/* Other UPI Apps Button -> Opens Search Directory */}
                <button
                  type="button"
                  onClick={() => {
                    setAppSearch("");
                    setModalView("other_apps");
                  }}
                  className="w-full flex items-center justify-between py-3 px-4 bg-canvas-soft hover:bg-canvas active:scale-[0.98] border border-hairline rounded-xl text-xs font-bold text-ink transition cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-ink-mute" />
                    <span>Other UPI Apps (BHIM, Navi, Tata Neu, Banks...)</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-mute" />
                </button>

                {/* Bank Account Direct Bypass Option */}
                <div className="bg-canvas-soft border border-hairline rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        <span>Paying from Bank Account?</span>
                      </p>
                      <p className="text-[11px] text-ink-mute leading-relaxed">
                        If PhonePe/GPay restricts bank accounts or shows a ₹2,000 limit, pay directly to UPI ID.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalView("manual")}
                      className="px-2.5 py-1.5 bg-canvas border border-hairline hover:border-ink/20 rounded-lg text-xs font-bold text-ink whitespace-nowrap active:scale-95 transition shadow-2xs cursor-pointer shrink-0"
                    >
                      Pay via Bank →
                    </button>
                  </div>
                </div>

                {/* Manual Transfer / Copy Note Action */}
                <div className="pt-2 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setModalView("manual")}
                    className="w-full text-center text-xs font-semibold text-ink-mute hover:text-ink underline transition py-1 cursor-pointer"
                  >
                    Not using a direct UPI app? Copy message & details →
                  </button>
                </div>
              </div>
            )}

            {/* ================= VIEW 2: SEARCHABLE LIST OF ALL 30+ UPI APPS ================= */}
            {modalView === "other_apps" && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search 30+ UPI apps (e.g. BHIM, Navi, HDFC...)"
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    autoFocus
                    className="w-full bg-canvas text-ink border border-hairline rounded-xl pl-9 pr-8 py-2.5 text-xs focus:outline-none focus:border-ink transition font-medium"
                  />
                  {appSearch && (
                    <button
                      type="button"
                      onClick={() => setAppSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-mute hover:text-ink p-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtered Apps Grid with Real Official Brand Favicons */}
                <div className="grid grid-cols-2 gap-2 max-h-[46vh] overflow-y-auto pr-0.5">
                  {filteredApps.map((app) => (
                    app.id === "phonepe" ? (
                      <a
                        key={app.id}
                        href={directUpiLink}
                        onClick={() => {
                          if (cleanToken && typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(cleanToken).catch(() => {});
                            setToastMessage(`Note "${cleanToken}" copied!`);
                            setTimeout(() => setToastMessage(null), 2500);
                          }
                        }}
                        className="flex items-center gap-2.5 py-2.5 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20 text-left cursor-pointer"
                      >
                        <AppOfficialFavicon app={app} />
                        <span className="truncate">{app.name}</span>
                      </a>
                    ) : (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => triggerAppLaunch(app)}
                        className="flex items-center gap-2.5 py-2.5 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20 text-left cursor-pointer"
                      >
                        <AppOfficialFavicon app={app} />
                        <span className="truncate">{app.name}</span>
                      </button>
                    )
                  ))}
                </div>

                {/* FALLBACK: IF APP NOT FOUND OR AT THE END -> OPEN IN PHONE'S APP CHOOSER */}
                <div className="pt-2 border-t border-hairline space-y-2">
                  <div className="bg-canvas-soft/80 border border-hairline rounded-xl p-3 text-center space-y-2">
                    <p className="text-xs text-ink-mute">
                      {filteredApps.length === 0
                        ? "App not found in directory? Launch your phone's native app chooser:"
                        : "Don't see your specific app listed?"}
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenSystemChooser}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-ink text-canvas hover:bg-ink/90 rounded-xl text-xs font-bold transition active:scale-[0.98] cursor-pointer shadow-sm"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Open in Phone&apos;s App Chooser</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalView("manual")}
                    className="w-full text-center text-xs text-ink-mute hover:text-ink underline py-1 transition cursor-pointer"
                  >
                    Paying via NetBanking or cash? Copy details manually →
                  </button>
                </div>
              </div>
            )}

            {/* ================= VIEW 3: COPY MESSAGE / DETAILS FOR INSTANT VERIFICATION ================= */}
            {modalView === "manual" && (
              <div className="space-y-3.5">
                <div className="bg-canvas-soft border border-hairline rounded-xl p-3 text-xs text-ink leading-relaxed space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-ink">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>Direct UPI ID Transfer (Bank Accounts Enabled)</span>
                  </p>
                  <p className="text-ink-mute text-[11px] leading-relaxed">
                    UPI apps (like PhonePe) restrict browser links to wallets or ₹2,000 max. 
                    To pay from any <strong>Bank Account</strong> with full limits, open PhonePe/GPay, tap <strong>&ldquo;To UPI ID&rdquo;</strong>, and enter these details:
                  </p>
                </div>

                {/* Verified Payee Name */}
                <div className="bg-canvas border border-hairline rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-ink-mute tracking-wider block">
                      Verified Payee Name
                    </span>
                    <span className="font-bold text-sm text-ink truncate block">{activePayeeName}</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Verified
                  </span>
                </div>

                {/* Copy Card: Note / Token */}
                <div className="bg-canvas border border-hairline rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-ink-mute tracking-wider block">
                      Message / Remarks Note (Required)
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

                {/* Amount Card */}
                <div className="bg-canvas border border-hairline rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-ink-mute tracking-wider block">
                      Payable Amount
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

            {/* ================= VIEW 4: PHONEPE BANK ACCOUNT RESTRICTION BYPASS ================= */}
            {modalView === "phonepe_notice" && (
              <div className="space-y-3.5">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-ink leading-relaxed space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>PhonePe Bank Account Restriction</span>
                  </p>
                  <p className="text-ink-mute text-[11px] leading-relaxed">
                    PhonePe deliberately <strong>disables Bank Accounts</strong> on website links and forces Wallet-only (showing a &ldquo;gallery QR / 2,000&rdquo; notice, even for ₹2).
                  </p>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-ink">To pay from your Bank Account, choose:</p>

                  {/* Option 1: Pay with Paytm (Confirmed working 100% by user) */}
                  <button
                    type="button"
                    onClick={() => {
                      const paytmApp = POPULAR_UPI_APPS.find(a => a.id === "paytm");
                      if (paytmApp) triggerAppLaunch(paytmApp);
                    }}
                    className="w-full text-left p-3 bg-canvas-soft hover:bg-canvas active:scale-[0.98] border border-hairline hover:border-ink/30 rounded-xl transition cursor-pointer shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink flex items-center gap-1.5">
                        <AppOfficialFavicon app={POPULAR_UPI_APPS.find(a => a.id === "paytm")!} />
                        <span>Pay with Paytm (1-Tap &amp; Bank Enabled)</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-mute leading-relaxed pl-7">
                      Paytm allows direct bank account transfers with pre-filled amount (₹{amountRupees}) and note ({cleanToken}).
                    </p>
                  </button>

                  {/* Option 2: Pay via PhonePe "To UPI ID" */}
                  <div className="bg-canvas border border-hairline rounded-xl p-3 space-y-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink flex items-center gap-1.5">
                        <AppOfficialFavicon app={POPULAR_UPI_APPS.find(a => a.id === "phonepe")!} />
                        <span>Pay in PhonePe via &ldquo;To UPI ID&rdquo;</span>
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                        All Banks
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-mute leading-relaxed">
                      Inside PhonePe, bank accounts work without any restrictions. Copy details and open PhonePe:
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between bg-canvas-soft border border-hairline px-2.5 py-1.5 rounded-lg text-xs">
                        <div>
                          <span className="text-[10px] text-ink-mute uppercase font-bold block">UPI ID</span>
                          <span className="font-mono font-bold text-ink">{activeUpiId}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="text-[10px] font-bold px-2 py-1 bg-canvas border border-hairline rounded hover:bg-canvas-soft active:scale-95 text-ink cursor-pointer"
                        >
                          {copiedUpi ? "✓ Copied" : "Copy ID"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between bg-canvas-soft border border-hairline px-2.5 py-1.5 rounded-lg text-xs">
                        <div>
                          <span className="text-[10px] text-ink-mute uppercase font-bold block">Note (Remarks)</span>
                          <span className="font-mono font-bold text-ink">{cleanToken}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyNote}
                          className="text-[10px] font-bold px-2 py-1 bg-canvas border border-hairline rounded hover:bg-canvas-soft active:scale-95 text-ink cursor-pointer"
                        >
                          {copiedNote ? "✓ Copied" : "Copy Note"}
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (typeof navigator !== "undefined" && navigator.clipboard) {
                          navigator.clipboard.writeText(activeUpiId).catch(() => {});
                          setToastMessage(`Copied ${activeUpiId}! Open "To UPI ID" in PhonePe`);
                          setTimeout(() => setToastMessage(null), 3000);
                        }
                        const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
                        if (isAndroid) {
                          window.location.href = "intent://#Intent;package=com.phonepe.app;end";
                        } else {
                          window.location.href = "phonepe://";
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-ink text-canvas hover:bg-ink/90 rounded-xl text-xs font-bold transition active:scale-[0.98] cursor-pointer shadow-sm"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Copy ID &amp; Launch PhonePe App</span>
                    </button>
                  </div>
                </div>

                {/* Force raw PhonePe link anyway */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
                      if (isAndroid) {
                        window.location.href = `intent://pay?${upiQuery}#Intent;scheme=upi;package=com.phonepe.app;end`;
                      } else {
                        window.location.href = `phonepe://pay?${upiQuery}`;
                      }
                    }}
                    className="text-[11px] text-ink-mute hover:text-ink underline transition cursor-pointer py-1"
                  >
                    Try direct link anyway (PhonePe Wallet / RuPay CC only) →
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
