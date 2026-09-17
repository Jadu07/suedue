"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { AlertCircle } from "lucide-react";

interface SplitData {
  splitId: string;
  billTitle: string;
  billDate: string;
  originalPaise: number;
  remainingPaise: number;
  hasActiveLink: boolean;
}

export default function PersonDetailsClient({ initialPerson, pendingSplits }: { initialPerson: any, pendingSplits: SplitData[] }) {
  const router = useRouter();
  
  // Person Edit State
  const [name, setName] = useState(initialPerson.name);
  const [phone, setPhone] = useState(initialPerson.phone);
  const [email, setEmail] = useState(initialPerson.email);
  const [notes, setNotes] = useState(initialPerson.notes);
  const [isActive, setIsActive] = useState(initialPerson.isActive);
  const [saving, setSaving] = useState(false);

  // Bill Selection State
  const [selectedSplits, setSelectedSplits] = useState<Set<string>>(new Set());
  const [sendingLink, setSendingLink] = useState(false);

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
      alert("Person updated successfully.");
      router.refresh();
    } catch (err) {
      alert("Error updating person");
    } finally {
      setSaving(false);
    }
  };

  const handleSendSelected = async () => {
    if (selectedSplits.size === 0) return alert("Select at least one bill.");
    
    // Check if any selected split already has an active link
    const hasActive = pendingSplits.some(s => selectedSplits.has(s.splitId) && s.hasActiveLink);
    if (hasActive) {
      if (!confirm("One or more selected bills already have an active payment link. Generating a new one will override the reminder (though old links may still work until expired/paid). Are you sure?")) {
        return;
      }
    }

    setSendingLink(true);
    try {
      const res = await fetch('/api/whatsapp/send-selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: initialPerson._id, splitIds: Array.from(selectedSplits) })
      });
      const data = await res.json();
      if (data.success) {
        alert("Consolidated payment link sent successfully via WhatsApp!");
        setSelectedSplits(new Set());
        router.refresh();
      } else {
        alert(data.error || "Failed to send");
      }
    } catch (err) {
      alert("Error sending message");
    } finally {
      setSendingLink(false);
    }
  };

  const totalSelected = pendingSplits
    .filter(s => selectedSplits.has(s.splitId))
    .reduce((acc, s) => acc + s.remainingPaise, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
      
      {/* Left: Pending Bills & Payment Links */}
      <div>
        <h2 className="heading-lg text-ink mb-md">Pending Dues & Payment Links</h2>
        <div className="bg-canvas border border-hairline rounded-lg overflow-hidden">
          {pendingSplits.length === 0 ? (
            <div className="p-xl text-center text-ink-mute">
              No pending dues for this person!
            </div>
          ) : (
            <>
              <div className="p-md bg-canvas-soft border-b border-hairline flex justify-between items-center">
                <span className="text-sm font-medium text-ink-mute">Select bills to request payment</span>
                <button 
                  onClick={() => {
                    if (selectedSplits.size === pendingSplits.length) setSelectedSplits(new Set());
                    else setSelectedSplits(new Set(pendingSplits.map(s => s.splitId)));
                  }}
                  className="text-primary text-xs hover:underline"
                >
                  {selectedSplits.size === pendingSplits.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <ul className="divide-y divide-hairline">
                {pendingSplits.map(split => (
                  <li key={split.splitId} className={`p-md flex items-start gap-md hover:bg-gray-50 transition cursor-pointer ${selectedSplits.has(split.splitId) ? 'bg-primary/5' : ''}`} onClick={() => toggleSplit(split.splitId)}>
                    <div className="pt-xs">
                      <input 
                        type="checkbox" 
                        checked={selectedSplits.has(split.splitId)}
                        onChange={() => {}} 
                        className="w-4 h-4 text-primary bg-canvas border-hairline rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-semibold text-ink">{split.billTitle}</span>
                        <span className="font-bold text-red-600">{formatMoney(split.remainingPaise)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-xs">
                        <span className="text-xs text-ink-mute">{new Date(split.billDate).toLocaleDateString()}</span>
                        {split.hasActiveLink && (
                          <span className="flex items-center gap-1 text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                            <AlertCircle className="w-3 h-3" /> Active Link Sent
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="p-md bg-canvas-soft border-t border-hairline flex justify-between items-center">
                <div>
                  <span className="text-sm text-ink-mute">Total Selected: </span>
                  <span className="font-bold text-ink">{formatMoney(totalSelected)}</span>
                </div>
                <Button 
                  onClick={handleSendSelected} 
                  disabled={selectedSplits.size === 0 || sendingLink}
                  className="btn-primary-dark"
                >
                  {sendingLink ? "Sending..." : "Generate & Send Link"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right: Edit Profile */}
      <div>
        <h2 className="heading-lg text-ink mb-md">Edit Profile</h2>
        <div className="bg-canvas border border-hairline rounded-lg p-xl">
          <form onSubmit={handleUpdatePerson} className="space-y-md">
            <div>
              <label className="block text-ink body-md mb-xs font-medium">Name</label>
              <input
                type="text" required
                className="w-full bg-canvas text-ink border border-hairline rounded-md px-md py-sm focus:outline-none focus:border-primary"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-ink body-md mb-xs font-medium">Phone Number</label>
              <input
                type="tel" required
                className="w-full bg-canvas text-ink border border-hairline rounded-md px-md py-sm focus:outline-none focus:border-primary"
                value={phone} onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-ink body-md mb-xs font-medium">Email (Optional)</label>
              <input
                type="email"
                className="w-full bg-canvas text-ink border border-hairline rounded-md px-md py-sm focus:outline-none focus:border-primary"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-ink body-md mb-xs font-medium">Notes</label>
              <textarea
                className="w-full bg-canvas text-ink border border-hairline rounded-md px-md py-sm focus:outline-none focus:border-primary min-h-[100px]"
                value={notes} onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-sm">
              <input
                type="checkbox" id="isActive"
                checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primary bg-canvas border-hairline rounded"
              />
              <label htmlFor="isActive" className="text-ink body-md">Active (Can be added to new bills)</label>
            </div>
            <div className="pt-md flex gap-md">
              <Button type="button" onClick={() => router.back()} className="btn-secondary-outline">Back</Button>
              <Button type="submit" disabled={saving} className="btn-primary-dark w-full">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
