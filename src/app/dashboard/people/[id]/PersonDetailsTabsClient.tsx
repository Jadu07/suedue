"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { 
  Clock, 
  CheckCircle2, 
  Link as LinkIcon, 
  User, 
  Copy, 
  Check, 
  MessageSquare, 
  ExternalLink,
  X,
  Plus
} from "lucide-react";

export default function PersonDetailsTabsClient({ 
  initialPerson, 
  pendingSplits, 
  paidSplits,
  activeRequests
}: any) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "active_links" | "history" | "profile">("pending");

  // Edit Person State
  const [name, setName] = useState(initialPerson.name);
  const [phone, setPhone] = useState(initialPerson.phone);
  const [email, setEmail] = useState(initialPerson.email);
  const [notes, setNotes] = useState(initialPerson.notes);
  const [isActive, setIsActive] = useState(initialPerson.isActive);
  const [saving, setSaving] = useState(false);

  // Link Generation State (pre-select all pending dues by default)
  const [selectedSplits, setSelectedSplits] = useState<Set<string>>(
    () => new Set(pendingSplits.map((s: any) => s.splitId))
  );
  const [sendingLink, setSendingLink] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Interactive Copy & WhatsApp Feedback State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedLinkInfo, setGeneratedLinkInfo] = useState<{
    link: string;
    refCode?: string;
    amountPaise?: number;
  } | null>(null);

  const getCleanLink = (rawLink?: string, reqId?: string) => {
    let link = rawLink || "";
    if (!link && reqId) {
      link = `/pay/${reqId}`;
    }
    if (typeof window !== "undefined" && window.location.origin) {
      try {
        if (link.startsWith("http://") || link.startsWith("https://")) {
          const u = new URL(link);
          return `${window.location.origin}${u.pathname}${u.search}`;
        } else if (link.startsWith("/")) {
          return `${window.location.origin}${link}`;
        }
      } catch (e) {
        // fallback to original
      }
    }
    return link;
  };

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openManualWhatsApp = (paymentLink: string, amountPaise?: number, breakdownNote?: string) => {
    let cleanPhone = initialPerson.phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    const amtStr = amountPaise ? ` for *${formatMoney(amountPaise)}*` : "";
    const cleanUrl = getCleanLink(paymentLink);
    const breakdown = breakdownNote ? `\n\n*Breakdown:*\n• ${breakdownNote}` : "";
    const text = encodeURIComponent(
      `Hi *${initialPerson.name}*,\nHere is your payment link${amtStr}:${breakdown}\n\n🔗 ${cleanUrl}\n\n_Powered by suedue_`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  const toggleSplit = (splitId: string) => {
    const next = new Set(selectedSplits);
    if (next.has(splitId)) next.delete(splitId);
    else next.add(splitId);
    setSelectedSplits(next);
  };

  const handleUpdatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/people/${initialPerson._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, notes, isActive }),
      });
      if (!res.ok) throw new Error("Failed to update");
      alert("Profile updated successfully!");
      router.refresh();
    } catch (err) {
      alert("Error updating person profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm("Cancel this active payment link? Recipients will no longer be able to use it.")) return;
    setCancellingId(requestId);
    try {
      const res = await fetch('/api/payments/request/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Payment link cancelled.");
        router.refresh();
      } else {
        alert(data.error || "Failed to cancel");
      }
    } catch (err) {
      alert("Error cancelling request");
    } finally {
      setCancellingId(null);
    }
  };

  const handleGenerateLink = async (sendWhatsApp = true) => {
    if (selectedSplits.size === 0) return alert("Select at least one bill.");
    const hasActive = pendingSplits.some((s: any) => selectedSplits.has(s.splitId) && s.hasActiveLink);
    if (hasActive) {
      if (!confirm("This will expire the old active link and create a replacement. Continue?")) return;
    }
    setSendingLink(true);
    try {
      const res = await fetch('/api/whatsapp/send-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: initialPerson._id, splitIds: Array.from(selectedSplits), sendWhatsApp })
      });
      const data = await res.json();
      if (data.success) {
        if (data.paymentLink) {
          setGeneratedLinkInfo({
            link: data.paymentLink,
            refCode: data.refCode,
            amountPaise: totalSelected
          });
        }
        setSelectedSplits(new Set());
        router.refresh();
        setActiveTab("active_links");
      } else {
        alert(data.error || "Failed to create payment link");
      }
    } catch (err) {
      alert("Error sending message");
    } finally {
      setSendingLink(false);
    }
  };

  const totalSelected = pendingSplits
    .filter((s: any) => selectedSplits.has(s.splitId))
    .reduce((acc: number, s: any) => acc + s.remainingPaise, 0);
  const selectedHasActiveLink = pendingSplits.some((s: any) => selectedSplits.has(s.splitId) && s.hasActiveLink);

  const tabs: {
    id: "pending" | "active_links" | "history" | "profile";
    label: string;
    shortLabel: string;
    icon: any;
  }[] = [
    { id: "pending", label: "Pending Dues", shortLabel: "Dues", icon: Clock },
    { id: "active_links", label: "Active Links", shortLabel: "Links", icon: LinkIcon },
    { id: "history", label: "Paid History", shortLabel: "History", icon: CheckCircle2 },
    { id: "profile", label: "Edit Profile", shortLabel: "Profile", icon: User },
  ];

  return (
    <div className="space-y-4">
      
      {/* Newly Generated Link Banner - Sleek, Minimal & Non-duplicate */}
      {generatedLinkInfo && activeTab !== "active_links" && (
        <div className="bg-[#161616] border border-[#a5d8ce]/20 rounded-2xl p-3.5 sm:p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white">
                    Payment link created for {formatMoney(generatedLinkInfo.amountPaise || totalSelected)}
                  </span>
                  {generatedLinkInfo.refCode && (
                    <span className="font-mono font-bold text-[11px] bg-[#1a1a1a] border border-[#333] px-1.5 py-0.5 rounded text-white">
                      {generatedLinkInfo.refCode}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Share via WhatsApp or copy the link below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-end">
              <button
                onClick={() => copyToClipboard(getCleanLink(generatedLinkInfo.link), "banner")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#a5d8ce] text-black hover:bg-[#a5d8ce]/90 active:scale-95 rounded-lg text-xs font-bold transition shadow-sm"
              >
                {copiedId === "banner" ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <button
                onClick={() => openManualWhatsApp(getCleanLink(generatedLinkInfo.link), generatedLinkInfo.amountPaise)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#161616] border border-[#333] hover:bg-[#1a1a1a] active:scale-95 text-white rounded-lg text-xs font-semibold transition"
                title="Send via WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                <span>WhatsApp</span>
              </button>

              <a
                href={getCleanLink(generatedLinkInfo.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-[#161616] border border-[#333] hover:bg-[#1a1a1a] rounded-lg text-gray-400 hover:text-white transition flex items-center justify-center"
                title="Open payment page in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setGeneratedLinkInfo(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1a1a] transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE NAVIGATION: Minimal Horizontal Scrolling Tabs */}
      <div className="sm:hidden flex items-center overflow-x-auto hide-scrollbar border-b border-[#333] gap-6 pb-px">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-2 text-xs font-bold transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-[#a5d8ce] text-white"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              {tab.shortLabel}
            </button>
          );
        })}
      </div>

      {/* DESKTOP NAVIGATION: Horizontal Clean Tabs (No numbers, pure text) */}
      <div className="hidden sm:flex border-b border-[#333] gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
                isActive
                  ? "border-[#a5d8ce] text-white"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content (Natural page scroll, no nested scroll trap) */}
      <div className="pt-1">
        
        {/* PENDING DUES TAB */}
        {activeTab === "pending" && (
          <div className="space-y-3">
            {pendingSplits.length === 0 ? (
              <div className="bg-[#161616] border border-[#333] rounded-2xl p-8 md:p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-gray-500" />
                <h3 className="font-bold text-white text-base">All caught up</h3>
                <p className="text-xs text-gray-400">No pending dues for {initialPerson.name}.</p>
              </div>
            ) : (
              <>
                {/* Header with Select All / Deselect All */}
                <div className="flex items-center justify-between px-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-300 tracking-wide">
                      Select Bills
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium bg-[#1a1a1a] px-2 py-0.5 rounded-md border border-[#333]">
                      {selectedSplits.size}/{pendingSplits.length}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (selectedSplits.size === pendingSplits.length) setSelectedSplits(new Set());
                      else setSelectedSplits(new Set(pendingSplits.map((s:any) => s.splitId)));
                    }}
                    className="text-[11px] font-semibold text-gray-400 hover:text-white transition"
                  >
                    {selectedSplits.size === pendingSplits.length ? "Deselect All" : "Select All"}
                  </button>
                </div>

                {/* Bills Selection List (Clean Minimal Cards, Consistent Styling) */}
                <div className="space-y-2">
                  {pendingSplits.map((split: any) => {
                    const isSelected = selectedSplits.has(split.splitId);
                    const billDateObj = split.billDate ? new Date(split.billDate) : null;
                    const formattedDate = billDateObj && !isNaN(billDateObj.getTime())
                      ? billDateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "Recently";
                    const isPartial = split.originalPaise > split.remainingPaise;

                    return (
                      <div 
                        key={split.splitId} 
                        onClick={() => toggleSplit(split.splitId)}
                        className={`p-3.5 sm:p-4 rounded-xl border transition-all duration-150 cursor-pointer select-none flex items-center justify-between gap-3.5 ${
                          isSelected 
                            ? "bg-[#1a1a1a]/80 border-[#a5d8ce] shadow-xl" 
                            : "bg-[#161616] border-[#333] hover:border-[#a5d8ce]/30"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {/* Custom Circular Check Selector */}
                          <div className="shrink-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              isSelected 
                                ? "bg-[#a5d8ce] border border-[#a5d8ce] text-black shadow-xs scale-105" 
                                : "border-2 border-[#333] bg-[#161616] hover:border-[#a5d8ce]/40"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                            </div>
                          </div>

                          {/* Bill Info */}
                          <div className="min-w-0">
                            <span className="font-bold text-white text-sm truncate block">
                              {split.billTitle}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                              <span className="text-[11px] font-medium">{formattedDate}</span>
                              {split.hasActiveLink && (
                                <span className="inline-flex items-center gap-1 text-[9px] text-amber-500 font-bold uppercase tracking-widest">
                                  <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                                  Linked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount Column - Dedicated, Clean & Prominent */}
                        <div className="text-right shrink-0 flex flex-col items-end justify-center">
                          <p className="font-black text-white text-lg sm:text-xl tracking-tight">
                            {formatMoney(split.remainingPaise)}
                          </p>
                          {isPartial && (
                            <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                              of {formatMoney(split.originalPaise)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Clean Bottom Action Bar */}
                <div className="bg-[#161616] border border-[#333] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-xl">
                  <div className="w-full sm:w-auto flex justify-between sm:flex-col items-baseline sm:items-start">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Selected</span>
                    <span className="font-black text-white text-2xl tracking-tight mt-0.5">{formatMoney(totalSelected)}</span>
                  </div>

                  <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/dashboard/bills/new?personId=${initialPerson._id}&returnTo=${encodeURIComponent(`/dashboard/people/${initialPerson._id}`)}`}
                      className="hidden sm:inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-[#333] bg-[#161616] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#1a1a1a] active:scale-[0.98]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Bill</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleGenerateLink(false)}
                      disabled={selectedSplits.size === 0 || sendingLink}
                      className="w-full sm:w-auto text-xs font-bold py-2.5 px-4 rounded-xl border border-[#333] bg-[#161616] text-white hover:bg-[#1a1a1a] active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      {selectedHasActiveLink ? "Update" : "Generate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateLink(true)}
                      disabled={selectedSplits.size === 0 || sendingLink}
                      className="w-full sm:w-auto text-xs font-bold py-2.5 px-6 rounded-xl bg-[#a5d8ce] text-black hover:bg-[#a5d8ce]/90 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition shadow-sm"
                    >
                      {sendingLink
                        ? "Creating link…"
                        : selectedSplits.size > 0
                          ? selectedHasActiveLink ? "Update & Send" : "Generate & Send"
                          : "Select Bills to Continue"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ACTIVE LINKS TAB */}
        {activeTab === "active_links" && (
          <div className="space-y-3">
            {activeRequests.length === 0 ? (
              <div className="bg-[#161616] border border-[#333] rounded-2xl p-8 md:p-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center mx-auto text-gray-400">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">No active payment links</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    There are no active links for {initialPerson.name}. Select pending dues to generate one.
                  </p>
                </div>
                {pendingSplits.length > 0 && (
                  <button
                    onClick={() => setActiveTab("pending")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#a5d8ce] text-black hover:bg-[#a5d8ce]/90 active:scale-95 rounded-xl text-xs font-bold transition shadow-sm mt-1"
                  >
                    <span>View Pending Dues</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {activeRequests.map((req: any) => {
                  const linkUrl = getCleanLink(req.paymentLink, req.id);
                  const formattedDate = req.createdAt
                    ? new Date(req.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "Recently";

                  return (
                    <div
                      key={req.id}
                      className="bg-[#161616] border border-[#333] hover:border-[#a5d8ce]/20 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-200 space-y-4"
                    >
                      {/* Top Row: Live status, Token & Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-amber-500">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            Awaiting
                          </span>

                          {req.refCode && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#1a1a1a] rounded text-[10px] font-mono font-bold text-gray-300">
                              <span>{req.refCode}</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-gray-400 font-medium shrink-0">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Main Amount & Bill Details */}
                      <div className="flex items-baseline justify-between gap-4 pt-0.5">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Requested Amount</p>
                          <p className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                            {formatMoney(req.amountPaise)}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold block">Covers</span>
                          <p className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-xs mt-0.5" title={req.linkedBills || "Consolidated Dues"}>
                            {req.linkedBills || "Consolidated Dues"}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#333]/60 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(linkUrl, req.id)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#a5d8ce] text-black hover:bg-[#a5d8ce]/90 active:scale-95 rounded-xl text-xs font-bold transition shadow-sm"
                          >
                            {copiedId === req.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => openManualWhatsApp(linkUrl, req.amountPaise, req.linkedBills)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#161616] border border-[#333] hover:bg-[#1a1a1a] active:scale-95 text-white rounded-xl text-xs font-semibold transition shadow-xl"
                            title="Send payment link via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                            <span>WhatsApp</span>
                          </button>

                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#161616] border border-[#333] hover:bg-[#1a1a1a] active:scale-95 rounded-xl text-gray-400 hover:text-white transition flex items-center justify-center shrink-0"
                            title="Open payment page in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <button 
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={cancellingId === req.id}
                          className="text-xs py-1.5 px-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50/50 rounded-lg transition font-medium w-full sm:w-auto text-center sm:text-right"
                        >
                          {cancellingId === req.id ? "Cancelling..." : "Cancel Link"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PAYMENT HISTORY TAB */}
        {activeTab === "history" && (
          <div className="bg-[#161616] border border-[#333] rounded-2xl overflow-hidden shadow-xl">
            {paidSplits.length === 0 ? (
              <div className="p-8 md:p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-gray-500" />
                <h3 className="font-bold text-white text-base">No paid bills yet</h3>
                <p className="text-xs text-gray-400">Settled payments will appear here.</p>
              </div>
            ) : (
              <>
                {/* Single Responsive Table View */}
                <div className="w-full overflow-hidden">
                  <table className="w-full text-left whitespace-nowrap table-fixed md:table-auto">
                    <thead className="bg-[#1a1a1a] border-b border-[#333]">
                      <tr>
                        <th className="px-4 py-3 text-gray-400 font-semibold text-[11px] uppercase tracking-wider w-1/2 md:w-auto truncate">Bill Title</th>
                        <th className="px-4 py-3 text-gray-400 font-semibold text-[11px] uppercase tracking-wider hidden md:table-cell">Date</th>
                        <th className="px-4 py-3 text-gray-400 font-semibold text-[11px] uppercase tracking-wider text-right w-1/4 md:w-auto">Amount</th>
                        <th className="px-4 py-3 text-gray-400 font-semibold text-[11px] uppercase tracking-wider text-center hidden sm:table-cell">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline text-gray-300">
                      {paidSplits.map((split: any) => (
                        <tr key={split.splitId} className="hover:bg-[#1a1a1a]/60 transition-colors">
                          <td className="px-4 py-3 font-bold text-white text-sm truncate">
                            <div className="flex flex-col">
                              <span className="truncate">{split.billTitle}</span>
                              <span className="text-[10px] text-gray-500 font-normal md:hidden">{split.billDate.split("T")[0]}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">{split.billDate.split("T")[0]}</td>
                          <td className="px-4 py-3 font-black text-white text-right">
                            <div className="flex flex-col items-end">
                              <span>{formatMoney(split.originalPaise)}</span>
                              <span className="text-[9px] font-bold text-green-400 uppercase sm:hidden mt-0.5">Settled</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center hidden sm:table-cell">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-white bg-[#1a1a1a] border border-[#333]">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              Settled
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* PROFILE SETTINGS TAB */}
        {activeTab === "profile" && (
          <div className="bg-[#161616] border border-[#333] rounded-2xl p-4 sm:p-6 max-w-2xl shadow-xl">
            <form onSubmit={handleUpdatePerson} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-[11px] uppercase tracking-wider font-semibold mb-1">Name</label>
                  <input
                    type="text" required
                    className="w-full bg-[#161616] text-white border border-[#333] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a5d8ce] font-medium text-xs transition"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-[11px] uppercase tracking-wider font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel" required
                    className="w-full bg-[#161616] text-white border border-[#333] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a5d8ce] font-medium font-mono text-xs transition"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-gray-400 text-[11px] uppercase tracking-wider font-semibold mb-1">Email</label>
                <input
                  type="email"
                  className="w-full bg-[#161616] text-white border border-[#333] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a5d8ce] font-medium text-xs transition"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-400 text-[11px] uppercase tracking-wider font-semibold mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full bg-[#161616] text-white border border-[#333] rounded-xl px-3 py-2 focus:outline-none focus:border-[#a5d8ce] font-medium text-xs transition"
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-white rounded accent-[#a5d8ce] cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-white cursor-pointer select-none">
                  Active Member (Receives payment reminders)
                </label>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="bg-[#a5d8ce] text-black hover:bg-[#8ec2b8] transition-colors w-full sm:w-auto text-xs py-2 px-xl shadow-sm"
                >
                  {saving ? "Saving Changes..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
