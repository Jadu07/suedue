"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#161616] border border-[#333] rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-mono text-3xl font-black tracking-widest text-[#a5d8ce] mb-2 lowercase">suedue</h1>
          <p className="text-gray-400 text-sm">Sign in to your admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-950/30 border border-red-900/50 text-red-400 text-sm p-3 rounded-xl text-center font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
            <input
              type="email"
              className="w-full bg-[#1a1a1a] text-white border border-[#333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#a5d8ce] focus:ring-1 focus:ring-[#a5d8ce] transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              className="w-full bg-[#1a1a1a] text-white border border-[#333] rounded-xl px-4 py-3 focus:outline-none focus:border-[#a5d8ce] focus:ring-1 focus:ring-[#a5d8ce] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-[#a5d8ce] text-black hover:bg-[#8ec2b8] active:scale-[0.98] rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center mt-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
