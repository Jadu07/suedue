"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-canvas flex items-center justify-center px-lg">
      <div className="bg-canvas-soft border border-hairline rounded-xl p-lg md:p-xxl max-w-[448px] w-full shadow-lg">
        <h1 className="display-lg text-ink mb-md text-center">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-md">
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          
          <div>
            <label className="block text-ink-mute body-md mb-xs">Email</label>
            <input
              type="email"
              className="w-full bg-canvas text-ink border border-hairline rounded-sm px-md py-sm focus:outline-none focus:border-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-ink-mute body-md mb-xs">Password</label>
            <input
              type="password"
              className="w-full bg-canvas text-ink border border-hairline rounded-sm px-md py-sm focus:outline-none focus:border-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full btn-primary-dark mt-lg"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
