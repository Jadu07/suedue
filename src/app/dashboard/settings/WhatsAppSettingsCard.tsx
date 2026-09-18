"use client";

import { useState } from "react";
import { MessageSquare, Calendar, Check, Loader2, Sparkles, Smartphone } from "lucide-react";

interface WhatsAppSettingsCardProps {
  initialIncludeYear: boolean;
}

export default function WhatsAppSettingsCard({ initialIncludeYear }: WhatsAppSettingsCardProps) {
  const [includeYear, setIncludeYear] = useState<boolean>(initialIncludeYear);
  const [saving, setSaving] = useState(false);
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    const nextValue = !includeYear;
    setIncludeYear(nextValue);
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "includeYearInWhatsApp",
          value: nextValue,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update setting");
      }

      setShowSavedFeedback(true);
      setTimeout(() => setShowSavedFeedback(false), 2200);
    } catch (err: any) {
      // Revert on failure
      setIncludeYear(!nextValue);
      setError(err.message || "Failed to save setting");
    } finally {
      setSaving(false);
    }
  };

  const sampleYear = new Date().getFullYear();

  return (
    <div className="bg-canvas border border-hairline rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-ink" />
          <h2 className="text-xs font-bold text-ink uppercase tracking-wider text-[11px]">
            WhatsApp Message Preferences
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {showSavedFeedback && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 animate-in fade-in duration-150">
              <Check className="w-3 h-3" />
              Saved
            </span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-canvas-soft border border-hairline text-ink-mute">
            <Smartphone className="w-3 h-3 text-ink-mute" />
            Reminders
          </span>
        </div>
      </div>

      {/* Main Toggle Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-canvas-soft/70 border border-hairline">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-ink" />
            <h3 className="text-xs font-bold text-ink sm:text-sm">
              Include Year in Split Dates
            </h3>
            {includeYear && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-ink text-canvas">
                {sampleYear}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-mute leading-relaxed">
            When enabled, WhatsApp reminder messages will append the 4-digit year to split item dates (e.g.{" "}
            <span className="font-mono text-ink font-semibold">19 Aug {sampleYear}</span> instead of{" "}
            <span className="font-mono text-ink font-semibold">19 Aug</span>).
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          {saving && <Loader2 className="w-3.5 h-3.5 text-ink-mute animate-spin" />}
          <button
            type="button"
            role="switch"
            aria-checked={includeYear}
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 ${
              includeYear ? "bg-ink" : "bg-hairline hover:bg-hairline-dark"
            } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                includeYear ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium">
          {error}
        </p>
      )}

      {/* Live Preview Box */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-bold text-ink-mute flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-ink-mute" />
            Live WhatsApp Message Preview
          </span>
          <span className="text-[11px] font-mono text-ink-mute">
            Format: {includeYear ? `DD MMM ${sampleYear}` : "DD MMM"}
          </span>
        </div>

        <div className="bg-canvas-soft/90 border border-hairline rounded-xl p-4 font-mono text-xs text-ink leading-relaxed space-y-2.5 shadow-2xs">
          <p className="text-ink">Hi <span className="font-bold">Vaibhav Singh</span>,</p>
          <p className="text-ink">You have pending dues of <span className="font-bold">₹620</span>.</p>

          <div className="space-y-1 pl-1">
            <p className="font-bold text-[11px] uppercase tracking-wider text-ink-mute font-sans">Breakdown:</p>
            <p className="text-ink">
              • Misal Pav/ Cold Coffee 17 Aug: <span className="font-bold">₹140</span>
            </p>
            <p className="text-ink">
              • Veg Thali <span className="font-bold text-ink bg-canvas px-1 py-0.5 rounded border border-hairline">{includeYear ? `19 Aug ${sampleYear}` : "19 Aug"}</span>: <span className="font-bold">₹150</span>
            </p>
            <p className="text-ink">
              • Poori Bhaji / Faluda <span className="font-bold text-ink bg-canvas px-1 py-0.5 rounded border border-hairline">{includeYear ? `21 Aug ${sampleYear}` : "21 Aug"}</span>: <span className="font-bold">₹130</span>
            </p>
            <p className="text-ink">
              • Fruit Salad / Juice <span className="font-bold text-ink bg-canvas px-1 py-0.5 rounded border border-hairline">{includeYear ? `24 Aug ${sampleYear}` : "24 Aug"}</span>: <span className="font-bold">₹110</span>
            </p>
            <p className="text-ink">
              • Poori Bhaji <span className="font-bold text-ink bg-canvas px-1 py-0.5 rounded border border-hairline">{includeYear ? `25 Aug ${sampleYear}` : "25 Aug"}</span>: <span className="font-bold">₹90</span>
            </p>
          </div>

          <div className="pt-1.5 space-y-0.5">
            <p className="text-ink-mute">🔗 Pay all at once here:</p>
            <p className="text-blue-600 underline truncate text-[11px]">https://suedue.vercel.app/pay/3214428872ad0aedbd590e...</p>
          </div>

          <p className="text-[11px] text-ink-mute italic pt-1">
            _Powered by suedue_
          </p>
        </div>
      </div>
    </div>
  );
}
