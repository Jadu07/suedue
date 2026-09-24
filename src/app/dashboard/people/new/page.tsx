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
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-[#161616] border border-[#333] rounded-xl p-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/dashboard/people" className="hover:text-white transition-colors">
              People
            </Link>
            <span>&gt;</span>
            <span className="text-white">Add Member</span>
          </div>
          <h1 className="text-xl font-bold text-white">Add New Member</h1>
        </div>
        <Link 
          href="/dashboard/people" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-[#1a1a1a] border border-[#333] px-4 py-2 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back to People
        </Link>
      </div>
      
      <div className="bg-[#161616] border border-[#333] rounded-xl p-6 shadow-xl relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-[#161616]/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#333] border-t-[#a5d8ce] rounded-full animate-spin"></div>
            <div className="text-white font-bold">Creating member...</div>
            {/* Skeleton effect while creating */}
            <div className="w-64 h-3 bg-[#333] rounded animate-pulse mt-2"></div>
            <div className="w-48 h-3 bg-[#333] rounded animate-pulse"></div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Yashraj Chouhan"
                className="w-full bg-[#1a1a1a] text-white border border-[#333] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#a5d8ce] transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g., 9131211880"
                className="w-full bg-[#1a1a1a] text-white border border-[#333] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#a5d8ce] transition-colors font-mono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Email Address (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g., yash@example.com"
              className="w-full bg-[#1a1a1a] text-white border border-[#333] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#a5d8ce] transition-colors"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
              Notes (Optional)
            </label>
            <textarea
              placeholder="Any context or nicknames..."
              rows={4}
              className="w-full bg-[#1a1a1a] text-white border border-[#333] rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#a5d8ce] transition-colors"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#333]">
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="px-6 py-2.5 rounded-lg text-sm font-bold text-gray-400 hover:text-white bg-transparent border border-transparent hover:bg-[#1a1a1a] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-[#a5d8ce] text-black px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#8ec2b8] transition-colors disabled:opacity-50"
            >
              <UserPlus size={16} />
              Save Member
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
