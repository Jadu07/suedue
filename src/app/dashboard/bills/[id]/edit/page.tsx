"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { use } from "react";
export default function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
        body: JSON.stringify({ title, description, date }),
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

  if (loading) return <div className="p-md md:p-huge text-center text-ink-mute">Loading...</div>;

  return (
    <div className="p-md md:p-huge max-w-3xl mx-auto">
      <h1 className="display-lg text-ink mb-xl">Edit Bill Details</h1>
      
      <div className="bg-canvas border border-hairline rounded-lg p-xxl">
        <form onSubmit={handleSubmit} className="space-y-md">
          <div>
            <label className="block text-ink body-md mb-xs font-medium">Title</label>
            <input
              type="text"
              required
              className="w-full bg-canvas text-ink border border-hairline rounded-md px-md py-sm focus:outline-none focus:border-primary"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-ink body-md mb-xs font-medium">Date</label>
            <input
              type="date"
              required
              className="w-full bg-canvas text-ink border border-hairline rounded-md px-md py-sm focus:outline-none focus:border-primary"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-ink body-md mb-xs font-medium">Description (Optional)</label>
            <textarea
              className="w-full bg-canvas text-ink border border-hairline rounded-md px-md py-sm focus:outline-none focus:border-primary min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <p className="micro text-ink-mute">
            Note: You cannot edit split amounts or people once the bill is created to preserve payment history integrity.
          </p>

          <div className="pt-md flex gap-md">
            <Button type="button" onClick={() => router.back()} className="btn-secondary-outline">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="btn-primary-dark">
              {saving ? "Saving..." : "Update Bill"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
