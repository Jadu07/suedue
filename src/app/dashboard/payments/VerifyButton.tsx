"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function VerifyButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to verify");
      
      alert(`Verified ${data.verifiedCount} pending payments.`);
      router.refresh();
    } catch (err: any) {
      alert("Error checking verification: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleVerify} disabled={loading} className="btn-primary-dark">
      {loading ? "Checking..." : "Verify FamPay Payments"}
    </Button>
  );
}
