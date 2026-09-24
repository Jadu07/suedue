"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { use } from "react";
export default function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  useEffect(() => {
    fetch(`/api/bills/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.bill) {
          setTitle(data.bill.title);
          setDescription(data.bill.description || "");
          setCategory(data.bill.category || "General");
          setDate(new Date(data.bill.date).toISOString().split("T")[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, category, date }),
      });

      if (!res.ok) throw new Error("Failed to update bill");

      router.push(`/dashboard/bills/${id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error updating bill");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 md:p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="p-md md:p-huge max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-8">Edit Bill Details</h1>
      
      <div className="bg-[#161616] border border-[#333] rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm mb-2 font-medium">Title</label>
            <input
              type="text"
              required
              className="w-full bg-[#161616] text-white border border-[#333] rounded-md px-4 py-2 focus:outline-none focus:border-[#a5d8ce]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-2 font-medium">Category</label>
            <select
              className="w-full bg-[#161616] text-white border border-[#333] rounded-md px-4 py-2 focus:outline-none focus:border-[#a5d8ce] cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="General">General</option>
              <option value="Food & Dining">Food & Dining</option>
              <option value="Utilities">Utilities</option>
              <option value="Rent">Rent</option>
              <option value="Travel">Travel</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-white text-sm mb-2 font-medium">Date</label>
            <input
              type="date"
              required
              className="w-full bg-[#161616] text-white border border-[#333] rounded-md px-4 py-2 focus:outline-none focus:border-[#a5d8ce]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-white text-sm mb-2 font-medium">Description (Optional)</label>
            <textarea
              className="w-full bg-[#161616] text-white border border-[#333] rounded-md px-4 py-2 focus:outline-none focus:border-[#a5d8ce] min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <p className="text-[11px] text-gray-400">
            Note: You cannot edit split amounts or people once the bill is created to preserve payment history integrity.
          </p>

          <div className="pt-4 flex gap-4">
            <Button type="button" onClick={() => router.back()} className="px-4 py-2 bg-transparent border border-[#333] rounded-xl text-white hover:bg-[#1a1a1a] transition font-bold text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="px-4 py-2 bg-[#a5d8ce] text-black hover:bg-[#8ec2b8] active:scale-95 rounded-xl text-xs font-bold transition shadow-sm">
              {saving ? "Saving..." : "Update Bill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
