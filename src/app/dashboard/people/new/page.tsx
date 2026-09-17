"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function NewPersonPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, notes }),
      });

      if (!res.ok) throw new Error("Failed to create person");

      router.push("/dashboard/people");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error adding person");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-md md:p-huge max-w-2xl mx-auto space-y-md">
      {/* Back Link */}
      <div>
        <Link 
          href="/dashboard/people" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-mute hover:text-ink transition py-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to People</span>
        </Link>
      </div>

      <div>
        <h1 className="display-lg text-ink font-black tracking-tight">Add Member</h1>
        <p className="text-xs text-ink-mute mt-0.5">
          Add someone to split bills with and send payment links to.
        </p>
      </div>
      
      <div className="bg-canvas border border-hairline rounded-xl p-md sm:p-xl shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-md">
          <div>
            <label className="block text-ink-mute text-[11px] uppercase tracking-wider font-semibold mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Yashraj Chouhan"
              className="w-full bg-canvas text-ink border border-hairline rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-ink transition font-medium"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-ink-mute text-[11px] uppercase tracking-wider font-semibold mb-1">
              WhatsApp Phone Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g., 9131211880"
              className="w-full bg-canvas text-ink border border-hairline rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-ink transition font-mono font-medium"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-[11px] text-ink-faint mt-1">
              Used to send automated or manual payment reminders.
            </p>
          </div>

          <div>
            <label className="block text-ink-mute text-[11px] uppercase tracking-wider font-semibold mb-1">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g., yash@example.com"
              className="w-full bg-canvas text-ink border border-hairline rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-ink transition font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-ink-mute text-[11px] uppercase tracking-wider font-semibold mb-1">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Any context or nicknames..."
              rows={3}
              className="w-full bg-canvas text-ink border border-hairline rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-ink transition font-medium"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary-dark text-xs py-2 px-xl shadow-sm flex items-center justify-center gap-2"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{loading ? "Saving Member..." : "Save Member"}</span>
            </button>
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="text-xs py-2 px-md text-ink-mute hover:text-ink transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
