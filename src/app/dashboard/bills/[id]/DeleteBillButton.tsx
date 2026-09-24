"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function DeleteBillButton({ billId, billTitle }: { billId: string, billTitle: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${billTitle}" and all associated splits?`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/bills/${billId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete bill");
      }
      router.push("/dashboard/bills");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      title="Permanently delete this bill"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#161616] hover:bg-red-900/30 border border-[#333] hover:border-red-800 active:scale-95 rounded-xl text-xs font-bold text-red-400 transition shadow-sm disabled:opacity-50"
    >
      <Trash2 className="w-3.5 h-3.5 text-red-400" />
      <span>{loading ? "Deleting..." : "Delete Bill"}</span>
    </button>
  );
}
