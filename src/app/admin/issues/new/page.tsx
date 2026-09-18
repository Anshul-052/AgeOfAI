"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewIssuePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    volume: "Volume I",
    issueNumber: 1
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error("Saving failed.");
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed.");
      setIsSaving(false);
    }
  };

  return (
    <main className="max-w-screen-md mx-auto px-edge-margin py-stack-lg min-h-screen">
      <h1 className="font-headline-xl text-headline-xl uppercase mb-8">New Issue</h1>
      
      {error && <div className="bg-error-container text-on-error-container p-4 mb-4">{error}</div>}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-label-caps uppercase mb-1">Volume</label>
          <input required className="w-full border-b border-primary bg-transparent focus:outline-none p-1" value={formData.volume} onChange={e => setFormData({...formData, volume: e.target.value})} />
        </div>
        <div>
          <label className="block font-label-caps uppercase mb-1">Issue Number</label>
          <input required type="number" className="w-full border-b border-primary bg-transparent focus:outline-none p-1" value={formData.issueNumber} onChange={e => setFormData({...formData, issueNumber: parseInt(e.target.value)})} />
        </div>
        
        <div className="pt-6">
          <button type="submit" disabled={isSaving} className="w-full bg-primary text-on-primary font-headline-md py-3 hover:opacity-90 disabled:opacity-50">
            {isSaving ? "Saving..." : "Create Issue"}
          </button>
        </div>
      </form>
    </main>
  );
}
