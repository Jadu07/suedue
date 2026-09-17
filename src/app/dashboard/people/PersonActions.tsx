"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical, MessageSquare, Send, ExternalLink, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PersonActions({ 
  personId, 
  personName, 
  personPhone,
  activeLinkUrl,
  activeRefCode,
}: { 
  personId: string; 
  personName: string;
  personPhone?: string;
  activeLinkUrl?: string | null;
  activeRefCode?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeLinkUrl) return;
    navigator.clipboard.writeText(activeLinkUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1500);
  };

  const handleSendAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (!confirm(`Send automated WhatsApp reminder to ${personName}?`)) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/whatsapp/send-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Consolidated reminder sent via WhatsApp bot!");
      } else {
        alert(data.error || "Failed to send");
      }
    } catch (err) {
      alert("Error sending message");
    } finally {
      setIsSending(false);
    }
  };

  const handleManualWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    if (!personPhone) {
      alert("No phone number found for this person");
      return;
    }
    let cleanPhone = personPhone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    
    let message = `Hi ${personName}, please check your pending dues on suedue.`;
    if (activeLinkUrl) {
      message = `Hi ${personName},\nHere is your payment link:\n${activeLinkUrl}\n\n_Powered by suedue_`;
    }
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  return (
    <div className={`relative inline-block text-left ${open ? "z-50" : ""}`} ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button 
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-lg border border-transparent hover:border-hairline hover:bg-canvas-soft transition text-ink-mute hover:text-ink focus:outline-none"
        title="More options"
        aria-label={`Options for ${personName}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 mt-1 w-52 bg-canvas border border-hairline rounded-xl shadow-2xl z-50 py-1 text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          {activeLinkUrl && (
            <button
              onClick={handleCopyLink}
              className="w-full text-left px-md py-2 hover:bg-canvas-soft flex items-center justify-between text-ink transition"
            >
              <div className="flex items-center gap-2">
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-ink-mute" />
                )}
                <span className={copied ? "text-green-600 font-bold" : "font-medium"}>
                  {copied ? "Link Copied!" : "Copy Payment Link"}
                </span>
              </div>
              {activeRefCode && (
                <span className="font-mono text-[10px] text-ink-faint px-1.5 py-0.5 bg-canvas-soft border border-hairline rounded">
                  {activeRefCode}
                </span>
              )}
            </button>
          )}

          {personPhone && (
            <button
              onClick={handleManualWhatsApp}
              className="w-full text-left px-md py-2 hover:bg-canvas-soft flex items-center gap-2 text-ink transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-ink-mute" />
              <span className="font-medium">Open WhatsApp Chat</span>
            </button>
          )}

          <button
            onClick={handleSendAll}
            disabled={isSending}
            className="w-full text-left px-md py-2 hover:bg-canvas-soft flex items-center gap-2 text-ink transition"
          >
            <Send className="w-3.5 h-3.5 text-ink-mute" />
            <span className="font-medium">{isSending ? "Sending..." : "Send Reminder (Bot)"}</span>
          </button>

          <div className="border-t border-hairline my-1"></div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              router.push(`/dashboard/people/${personId}`);
            }}
            className="w-full text-left px-md py-2 hover:bg-canvas-soft flex items-center gap-2 text-ink-mute hover:text-ink transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Profile & Dues</span>
          </button>
        </div>
      )}
    </div>
  );
}
