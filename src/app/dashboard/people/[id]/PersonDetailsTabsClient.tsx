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
        <div className="bg-canvas border border-ink/20 rounded-2xl p-3.5 sm:p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-canvas-soft border border-hairline flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-ink">
                    Payment link created for {formatMoney(generatedLinkInfo.amountPaise || totalSelected)}
                  </span>
                  {generatedLinkInfo.refCode && (
                    <span className="font-mono font-bold text-[11px] bg-canvas-soft border border-hairline px-1.5 py-0.5 rounded text-ink">
                      {generatedLinkInfo.refCode}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-ink-mute mt-0.5">
                  Share via WhatsApp or copy the link below.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 justify-end">
              <button
                onClick={() => copyToClipboard(getCleanLink(generatedLinkInfo.link), "banner")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink text-canvas hover:bg-ink/90 active:scale-95 rounded-lg text-xs font-bold transition shadow-sm"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-canvas border border-hairline hover:bg-canvas-soft active:scale-95 text-ink rounded-lg text-xs font-semibold transition"
                title="Send via WhatsApp"
              >
                <MessageSquare className="w-3.5 h-3.5 text-ink-mute" />
                <span>WhatsApp</span>
              </button>

              <a
                href={getCleanLink(generatedLinkInfo.link)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 bg-canvas border border-hairline hover:bg-canvas-soft rounded-lg text-ink-mute hover:text-ink transition flex items-center justify-center"
                title="Open payment page in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setGeneratedLinkInfo(null)}
                className="p-1.5 text-ink-mute hover:text-ink rounded-lg hover:bg-canvas-soft transition"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE NAVIGATION: 4-Segmented Clean Control (No numbers, pure text) */}
      <div className="sm:hidden grid grid-cols-4 bg-canvas-soft border border-hairline p-1 rounded-xl gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 rounded-lg text-xs transition-all text-center ${
                isActive
                  ? "bg-canvas text-ink shadow-2xs font-bold border border-hairline/80"
                  : "text-ink-mute hover:text-ink font-medium"
              }`}
            >
              <span className="truncate block">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* DESKTOP NAVIGATION: Horizontal Clean Tabs (No numbers, pure text) */}
      <div className="hidden sm:flex border-b border-hairline gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs transition-colors whitespace-nowrap ${
                isActive
                  ? "border-ink text-ink"
                  : "border-transparent text-ink-mute hover:text-ink"
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
              <div className="bg-canvas border border-hairline rounded-2xl p-8 md:p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-ink-faint" />
                <h3 className="font-bold text-ink text-base">All caught up</h3>
                <p className="text-xs text-ink-mute">No pending dues for {initialPerson.name}.</p>
              </div>
            ) : (
              <>
                {/* Header with Select All / Deselect All */}
                <div className="flex items-center justify-between px-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-ink uppercase tracking-wider">
                      Select Bills
                    </span>
                    <span className="text-[11px] text-ink-mute font-medium">
                      ({selectedSplits.size} of {pendingSplits.length} selected)
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      if (selectedSplits.size === pendingSplits.length) setSelectedSplits(new Set());
                      else setSelectedSplits(new Set(pendingSplits.map((s:any) => s.splitId)));
                    }}
                    className="text-xs font-semibold text-ink hover:text-ink/80 py-1 px-2.5 rounded-lg hover:bg-canvas-soft transition"
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
                            ? "bg-canvas-soft/80 border-ink shadow-2xs" 
                            : "bg-canvas border-hairline hover:border-ink/30"
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          {/* Custom Circular Check Selector */}
                          <div className="shrink-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                              isSelected 
                                ? "bg-ink border border-ink text-canvas shadow-xs scale-105" 
                                : "border-2 border-hairline bg-canvas hover:border-ink/40"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                            </div>
                          </div>

                          {/* Bill Info */}
                          <div className="min-w-0">
                            <span className="font-bold text-ink text-sm truncate block">
                              {split.billTitle}
                            </span>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ink-mute">
                              <span className="text-[11px] font-medium">{formattedDate}</span>
                              {split.hasActiveLink && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] bg-amber-500/10 text-amber-900 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold tracking-wider uppercase">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  Active Link
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount Column - Dedicated, Clean & Prominent */}
                        <div className="text-right shrink-0 flex flex-col items-end justify-center">
                          <p className="font-black text-ink text-lg sm:text-xl tracking-tight">
                            {formatMoney(split.remainingPaise)}
                          </p>
                          {isPartial && (
                            <span className="text-[10px] text-ink-mute font-medium mt-0.5">
                              of {formatMoney(split.originalPaise)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Clean Bottom Action Bar */}
                <div className="bg-canvas border border-hairline rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-2xs">
                  <div className="w-full sm:w-auto flex justify-between sm:flex-col items-baseline sm:items-start">
                    <span className="text-[10px] text-ink-mute uppercase tracking-wider font-semibold">Total Selected</span>
                    <span className="font-black text-ink text-2xl tracking-tight mt-0.5">{formatMoney(totalSelected)}</span>
                  </div>

                  <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/dashboard/bills/new?personId=${initialPerson._id}&returnTo=${encodeURIComponent(`/dashboard/people/${initialPerson._id}`)}`}
                      className="hidden sm:inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-hairline bg-canvas px-4 py-2.5 text-xs font-bold text-ink transition hover:bg-canvas-soft active:scale-[0.98]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Bill</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleGenerateLink(true)}
                      disabled={selectedSplits.size === 0 || sendingLink}
                      className="w-full sm:w-auto text-xs font-bold py-2.5 px-6 rounded-xl bg-ink text-canvas hover:bg-ink/90 active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition shadow-sm"
                    >
                      {sendingLink
                        ? "Creating link…"
                        : selectedSplits.size > 0
                          ? selectedHasActiveLink ? "Update & send link" : "Generate & send link"
                          : "Select Bills to Continue"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateLink(false)}
                      disabled={selectedSplits.size === 0 || sendingLink}
                      className="w-full sm:w-auto text-xs font-bold py-2.5 px-4 rounded-xl border border-hairline bg-canvas text-ink hover:bg-canvas-soft active:scale-[0.98] disabled:opacity-30 disabled:pointer-events-none transition"
                    >
                      {selectedHasActiveLink ? "Update link only" : "Create link only"}
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
              <div className="bg-canvas border border-hairline rounded-2xl p-8 md:p-12 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-canvas-soft border border-hairline flex items-center justify-center mx-auto text-ink-mute">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-ink text-sm sm:text-base">No active payment links</h3>
                  <p className="text-xs text-ink-mute mt-1 max-w-sm mx-auto">
                    There are no active links for {initialPerson.name}. Select pending dues to generate one.
                  </p>
                </div>
                {pendingSplits.length > 0 && (
                  <button
                    onClick={() => setActiveTab("pending")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-ink text-canvas hover:bg-ink/90 active:scale-95 rounded-xl text-xs font-bold transition shadow-sm mt-1"
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
                      className="bg-canvas border border-hairline hover:border-ink/20 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all duration-200 space-y-4"
                    >
                      {/* Top Row: Live status, Token & Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-900 border border-amber-500/20 text-[10px] uppercase font-bold rounded-full tracking-wider">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                            </span>
                            Awaiting Payment
                          </span>

                          {req.refCode && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-canvas-soft border border-hairline rounded-md text-[11px] font-mono font-bold text-ink">
                              <span className="text-[9px] text-ink-mute font-sans uppercase font-medium">Token</span>
                              <span>{req.refCode}</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] text-ink-mute font-medium shrink-0">
                          {formattedDate}
                        </span>
                      </div>

                      {/* Main Amount & Bill Details */}
                      <div className="flex items-baseline justify-between gap-4 pt-0.5">
                        <div>
                          <p className="text-[10px] text-ink-mute uppercase tracking-wider font-semibold">Requested Amount</p>
                          <p className="text-2xl sm:text-3xl font-black text-ink tracking-tight mt-0.5">
                            {formatMoney(req.amountPaise)}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-ink-mute uppercase tracking-wider font-semibold block">Covers</span>
                          <p className="text-xs sm:text-sm font-bold text-ink truncate max-w-[180px] sm:max-w-xs mt-0.5" title={req.linkedBills || "Consolidated Dues"}>
                            {req.linkedBills || "Consolidated Dues"}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-hairline/60 flex-wrap sm:flex-nowrap">
                        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(linkUrl, req.id)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-ink text-canvas hover:bg-ink/90 active:scale-95 rounded-xl text-xs font-bold transition shadow-sm"
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
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-canvas border border-hairline hover:bg-canvas-soft active:scale-95 text-ink rounded-xl text-xs font-semibold transition shadow-2xs"
                            title="Send payment link via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-ink-mute" />
                            <span>WhatsApp</span>
                          </button>

                          <a
                            href={linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-canvas border border-hairline hover:bg-canvas-soft active:scale-95 rounded-xl text-ink-mute hover:text-ink transition flex items-center justify-center shrink-0"
                            title="Open payment page in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <button 
                          onClick={() => handleCancelRequest(req.id)}
                          disabled={cancellingId === req.id}
                          className="text-xs py-1.5 px-2.5 text-ink-mute hover:text-red-600 hover:bg-red-50/50 rounded-lg transition font-medium w-full sm:w-auto text-center sm:text-right"
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
          <div className="bg-canvas border border-hairline rounded-2xl overflow-hidden shadow-2xs">
            {paidSplits.length === 0 ? (
              <div className="p-8 md:p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-ink-faint" />
                <h3 className="font-bold text-ink text-base">No paid bills yet</h3>
                <p className="text-xs text-ink-mute">Settled payments will appear here.</p>
              </div>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-hairline">
                  {paidSplits.map((split: any) => (
                    <div key={split.splitId} className="p-3.5 space-y-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <h4 className="font-bold text-ink text-sm truncate">{split.billTitle}</h4>
                        <span className="font-black text-ink text-sm">
                          {formatMoney(split.originalPaise)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-ink-mute">
                        <span>{split.billDate.split("T")[0]}</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-ink text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Settled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <table className="w-full text-left">
                    <thead className="bg-canvas-soft border-b border-hairline">
                      <tr>
                        <th className="px-lg py-md text-ink-mute font-semibold text-[11px] uppercase tracking-wider">Bill Title</th>
                        <th className="px-lg py-md text-ink-mute font-semibold text-[11px] uppercase tracking-wider">Date</th>
                        <th className="px-lg py-md text-ink-mute font-semibold text-[11px] uppercase tracking-wider text-right">Amount</th>
                        <th className="px-lg py-md text-ink-mute font-semibold text-[11px] uppercase tracking-wider text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {paidSplits.map((split: any) => (
                        <tr key={split.splitId} className="hover:bg-canvas-soft/60 transition-colors">
                          <td className="px-lg py-md font-bold text-ink text-sm">{split.billTitle}</td>
                          <td className="px-lg py-md text-xs text-ink-mute">{split.billDate.split("T")[0]}</td>
                          <td className="px-lg py-md font-black text-ink text-right">{formatMoney(split.originalPaise)}</td>
                          <td className="px-lg py-md text-center">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold text-ink bg-canvas-soft border border-hairline">
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
          <div className="bg-canvas border border-hairline rounded-2xl p-4 sm:p-6 max-w-2xl shadow-2xs">
            <form onSubmit={handleUpdatePerson} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-ink-mute text-[11px] uppercase tracking-wider font-semibold mb-1">Name</label>
                  <input
                    type="text" required
                    className="w-full bg-canvas text-ink border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-ink font-medium text-xs transition"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-ink-mute text-[11px] uppercase tracking-wider font-semibold mb-1">Phone Number</label>
                  <input
                    type="tel" required
                    className="w-full bg-canvas text-ink border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-ink font-medium font-mono text-xs transition"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-ink-mute text-[11px] uppercase tracking-wider font-semibold mb-1">Email</label>
                <input
                  type="email"
                  className="w-full bg-canvas text-ink border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-ink font-medium text-xs transition"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-ink-mute text-[11px] uppercase tracking-wider font-semibold mb-1">Notes</label>
                <textarea
                  rows={3}
                  className="w-full bg-canvas text-ink border border-hairline rounded-xl px-3 py-2 focus:outline-none focus:border-ink font-medium text-xs transition"
                  value={notes} onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-ink rounded accent-ink cursor-pointer"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-ink cursor-pointer select-none">
                  Active Member (Receives payment reminders)
                </label>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="btn-primary-dark w-full sm:w-auto text-xs py-2 px-xl shadow-sm"
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
