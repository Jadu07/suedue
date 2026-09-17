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
  ArrowLeft
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

interface UPIAppConfig {
  id: string;
  name: string;
  pkg?: string;
  scheme?: string;
}

// Authentic Vector SVG Logos for each UPI App
function AppBrandLogo({ id }: { id: string }) {
  switch (id) {
    case "gpay":
      return (
        <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
      );
    case "phonepe":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#5f259f"/>
          <path fill="#ffffff" d="M34.5 17.5h-5.2c.4-1.2.7-2.5.7-3.8 0-.9-.7-1.7-1.6-1.7h-3.8c-.7 0-1.3.4-1.5 1.1l-.8 3.4h-3.3c-.6 0-1.1.5-1.1 1.1v2.5c0 .6.5 1.1 1.1 1.1h2.3l-2.4 10.4c-.2.8.4 1.6 1.3 1.6h3.4c.7 0 1.3-.5 1.5-1.1l1.7-7.4h2.5c4.6 0 7.8-2.7 7.8-7.2 0-.2 0-.4-.1-.5zm-6.2 5.5h-2.9l1.1-4.7h2c1.8 0 3.1.9 3.1 2.4 0 1.5-1.3 2.3-3.3 2.3z"/>
          <path fill="#ffffff" d="M30 33c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      );
    case "paytm":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full bg-white shadow-2xs border border-gray-100 p-0.5">
          <text x="3" y="31" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="16" fill="#002e6e">Pay</text>
          <text x="29" y="31" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="16" fill="#00b9f5">tm</text>
        </svg>
      );
    case "cred":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#000000"/>
          <path fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" d="M14 15h20v14a10 10 0 0 1-20 0V15zm6 0v14a4 4 0 0 0 8 0V15m-4 14v4"/>
        </svg>
      );
    case "bhim":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#003764"/>
          <path fill="#00A651" d="M26 10l-12 14h9l-3 14 14-16h-9l3-12z"/>
          <path fill="#F58220" d="M28 10l-6 7h6l-2 7 8-9h-6l2-5z"/>
        </svg>
      );
    case "amazonpay":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#232f3e"/>
          <path fill="#ff9900" d="M14 27c4 3.5 11 4.5 17 0 .5-.4 1.2 0 .8.6-5 4-13 4-18.5-.1-.4-.3 0-.8.7-.5z"/>
          <path fill="#ff9900" d="M31.5 25.5c.6.8 1.8 1.2 2.5 1 .3-.1.4-.4.3-.6-.5-.9-1.5-2.2-2.5-2.1-.2 0-.4.2-.4.4 0 .3.1.9.1 1.3z"/>
          <text x="14" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="11" fill="#ffffff">pay</text>
        </svg>
      );
    case "navi":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#00D09C"/>
          <path fill="#000000" d="M16 33V15h4.5l8 11.5V15H32v18h-4.5l-8-11.5V33H16z"/>
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#25D366"/>
          <path fill="#ffffff" d="M24 11c-7.2 0-13 5.8-13 13 0 2.4.7 4.7 1.9 6.7L11 37l6.6-1.7c1.9 1.1 4.1 1.7 6.4 1.7 7.2 0 13-5.8 13-13s-5.8-13-13-13zm6.5 18.4c-.3.8-1.6 1.5-2.2 1.6-.6.1-1.3.2-4.3-1-3.6-1.5-5.9-5.1-6.1-5.3-.2-.2-1.5-2-1.5-3.8 0-1.8.9-2.7 1.3-3.1.3-.3.8-.5 1.2-.5.1 0 .3 0 .4.1.4 0 .6.1.8.6.3.8 1 2.5 1.1 2.7.1.2.1.4 0 .6-.1.2-.2.4-.4.6l-.6.7c-.2.2-.4.4-.2.7.5.9 1.4 2.1 2.7 2.9 1.7 1.1 2.8 1.4 3.2 1.6.4.2.6.1.8-.1.3-.3 1.1-1.3 1.4-1.7.3-.4.6-.3.9-.2.4.1 2.3 1.1 2.7 1.3.4.2.7.3.8.5.1.3.1 1.4-.2 2.2z"/>
        </svg>
      );
    case "tataneu":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#3D195B"/>
          <text x="11" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="16" fill="#ffffff">neu</text>
        </svg>
      );
    case "jupiter":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#F46A35"/>
          <path fill="#ffffff" d="M21 16h6v12a4 4 0 0 1-8 0v-2h4v2a1 1 0 0 0 2 0V16z"/>
          <circle cx="24" cy="12" r="2" fill="#ffffff"/>
        </svg>
      );
    case "fi":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#00C9A7"/>
          <text x="14" y="31" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="20" fill="#000000">fi</text>
        </svg>
      );
    case "slice":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#7822E6"/>
          <path fill="#ffffff" d="M16 27l14-14v16a3 3 0 0 1-3 3H16v-5z"/>
        </svg>
      );
    case "mobikwik":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#1A73E8"/>
          <text x="10" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="16" fill="#ffffff">MK</text>
        </svg>
      );
    case "freecharge":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#F68220"/>
          <path fill="#ffffff" d="M18 16h12v4h-8v4h6v4h-6v6h-4V16z"/>
        </svg>
      );
    case "payzapp":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#004c8f"/>
          <rect x="15" y="15" width="18" height="18" fill="#ed1c24"/>
          <rect x="18" y="18" width="12" height="12" fill="#ffffff"/>
          <rect x="21" y="15" width="6" height="18" fill="#004c8f"/>
          <rect x="15" y="21" width="18" height="6" fill="#004c8f"/>
        </svg>
      );
    case "imobile":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#B02A30"/>
          <circle cx="24" cy="24" r="11" fill="none" stroke="#F58220" strokeWidth="3"/>
          <path fill="#ffffff" d="M21 17h6v3h-6zm0 5h6v9h-6z"/>
        </svg>
      );
    case "yono":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#0082c6"/>
          <circle cx="24" cy="24" r="11" fill="#ffffff"/>
          <circle cx="24" cy="24" r="5" fill="#0082c6"/>
          <rect x="22.5" y="24" width="3" height="11" fill="#0082c6"/>
        </svg>
      );
    case "kotak":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#EE1C25"/>
          <path fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" d="M16 24c0-3.5 3-5 5.5-2.5L24 24l2.5 2.5c2.5 2.5 5.5 1 5.5-2.5s-3-5-5.5-2.5L24 24l-2.5-2.5C19 19 16 20.5 16 24z"/>
        </svg>
      );
    case "axis":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#97124B"/>
          <path fill="#ffffff" d="M24 13l-10 18h6.5l3.5-7 3.5 7H34L24 13zm0 7.5l2.2 4.5h-4.4L24 20.5z"/>
        </svg>
      );
    case "bob":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#F26522"/>
          <circle cx="24" cy="24" r="8" fill="none" stroke="#ffffff" strokeWidth="3"/>
          <path fill="#ffffff" d="M24 10v4m0 20v4m-14-14h4m20 0h4"/>
        </svg>
      );
    case "pnb":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#A20A3A"/>
          <text x="9" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="13" fill="#FFCC00">PNB</text>
        </svg>
      );
    case "canara":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#0089CF"/>
          <polygon points="16,32 24,16 32,32" fill="#FFCC00"/>
          <polygon points="20,28 24,20 28,28" fill="#0089CF"/>
        </svg>
      );
    case "federal":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#0C2340"/>
          <text x="11" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="13" fill="#FFC72C">FED</text>
        </svg>
      );
    case "bajaj":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#0072BC"/>
          <text x="8" y="30" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="11" fill="#ffffff">BAJAJ</text>
        </svg>
      );
    case "samsung":
      return (
        <svg viewBox="0 0 48 48" className="w-6 h-6 shrink-0 rounded-full shadow-2xs">
          <rect width="48" height="48" rx="24" fill="#1428A0"/>
          <path fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" d="M17 28c0 3 2 4 4.5 4 4 0 5.5-2.5 5.5-5s-3-3.5-5.5-4.5c-2.5-1-4-2-4-4s2-3.5 4.5-3.5c2 0 4 1 4.5 3"/>
        </svg>
      );
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink font-bold text-[10px] shrink-0 shadow-2xs">
          UPI
        </div>
      );
  }
}

const POPULAR_UPI_APPS: UPIAppConfig[] = [
  { id: "gpay", name: "Google Pay", pkg: "com.google.android.apps.nbu.paisa.user", scheme: "tez://upi/pay" },
  { id: "phonepe", name: "PhonePe", pkg: "com.phonepe.app", scheme: "phonepe://pay" },
  { id: "paytm", name: "Paytm", pkg: "net.one97.paytm", scheme: "paytmmp://pay" },
  { id: "cred", name: "CRED", pkg: "com.dreamplug.androidapp", scheme: "credpay://upi/pay" },
  { id: "bhim", name: "BHIM (NPCI)", pkg: "in.org.npci.upiapp", scheme: "upi://pay" },
  { id: "amazonpay", name: "Amazon Pay", pkg: "in.amazon.mShop.android.shopping", scheme: "amazonpay://upi/pay" },
  { id: "navi", name: "Navi UPI", pkg: "com.naviapp", scheme: "navi://upi/pay" },
  { id: "tataneu", name: "Tata Neu", pkg: "com.tatadigital.tcp", scheme: "tataneu://upi/pay" },
  { id: "whatsapp", name: "WhatsApp Pay", pkg: "com.whatsapp", scheme: "whatsapp://pay" },
  { id: "jupiter", name: "Jupiter Money", pkg: "money.jupiter", scheme: "jupiter://upi/pay" },
  { id: "fi", name: "Fi Money", pkg: "money.fi.banking", scheme: "fi://upi/pay" },
  { id: "slice", name: "Slice", pkg: "org.slice.app", scheme: "slice://upi/pay" },
  { id: "mobikwik", name: "MobiKwik", pkg: "com.mobikwik_new", scheme: "mobikwik://upi/pay" },
  { id: "freecharge", name: "Freecharge", pkg: "com.freecharge.android", scheme: "freecharge://upi/pay" },
  { id: "payzapp", name: "PayZapp (HDFC)", pkg: "com.enStage.wibmo.hdfc", scheme: "payzapp://upi/pay" },
  { id: "imobile", name: "iMobile Pay (ICICI)", pkg: "com.csam.icici.bank.imobile", scheme: "imobile://upi/pay" },
  { id: "yono", name: "YONO SBI", pkg: "com.sbi.lotusintouch", scheme: "yono://upi/pay" },
  { id: "kotak", name: "Kotak 811", pkg: "com.msf.kbank.mobile", scheme: "kotak://upi/pay" },
  { id: "axis", name: "Axis Mobile", pkg: "com.axis.mobile", scheme: "axis://upi/pay" },
  { id: "bob", name: "bob World (Bank of Baroda)", pkg: "com.bankofbaroda.mconnect", scheme: "bobworld://upi/pay" },
  { id: "pnb", name: "PNB ONE", pkg: "com.pnb.pnbone", scheme: "pnbone://upi/pay" },
  { id: "canara", name: "Canara ai1", pkg: "com.canarabank.mobility", scheme: "canaraai1://upi/pay" },
  { id: "federal", name: "FedMobile (Federal Bank)", pkg: "com.fedmobile", scheme: "fedmobile://upi/pay" },
  { id: "bajaj", name: "Bajaj Finserv", pkg: "org.altruist.BajajExperia", scheme: "bajajfinserv://upi/pay" },
  { id: "samsung", name: "Samsung Pay", pkg: "com.samsung.android.spay", scheme: "samsungpay://upi/pay" },
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
    if (cleanToken && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(cleanToken).catch(() => {});
      setToastMessage(`Note "${cleanToken}" copied!`);
      setTimeout(() => setToastMessage(null), 2500);
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
    return POPULAR_UPI_APPS.filter(a => a.name.toLowerCase().includes(q));
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
                    {modalView === "manual" && "Copy Payment Details"}
                  </h3>
                  <p className="text-xs text-ink-mute mt-0.5">
                    {modalView === "main" && "Select your preferred app"}
                    {modalView === "other_apps" && "Search 25+ verified UPI apps"}
                    {modalView === "manual" && "For NetBanking, IMPS, or bank apps"}
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
                {/* 4 Primary Top Apps with Original Logos */}
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_UPI_APPS.slice(0, 4).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => triggerAppLaunch(app)}
                      className="flex items-center gap-2.5 py-3 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20 cursor-pointer text-left"
                    >
                      <AppBrandLogo id={app.id} />
                      <span className="truncate">{app.name}</span>
                    </button>
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

            {/* ================= VIEW 2: SEARCHABLE LIST OF ALL 25+ UPI APPS ================= */}
            {modalView === "other_apps" && (
              <div className="space-y-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-mute absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search 25+ UPI apps (e.g. BHIM, Navi, HDFC...)"
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

                {/* Filtered Apps Grid with Original Logos */}
                <div className="grid grid-cols-2 gap-2 max-h-[46vh] overflow-y-auto pr-0.5">
                  {filteredApps.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => triggerAppLaunch(app)}
                      className="flex items-center gap-2.5 py-2.5 px-3 bg-canvas hover:bg-canvas-soft active:scale-[0.97] border border-hairline rounded-xl font-bold text-xs text-ink transition shadow-2xs hover:border-ink/20 text-left cursor-pointer"
                    >
                      <AppBrandLogo id={app.id} />
                      <span className="truncate">{app.name}</span>
                    </button>
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
                <div className="bg-canvas-soft border border-hairline rounded-xl p-3 text-xs text-ink leading-relaxed">
                  Transfer from any NetBanking or banking app using the details below. <strong className="font-bold">Be sure to paste the Note in remarks</strong> for instant verification!
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
